import datetime
from rest_framework import generics
from accounts.models import User
from .models import (Attendance, 
                    LeaveRequest,
                    EmployeeProfile,
                    Payroll,
                    Holiday
)
from django.db.models import Prefetch
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsEmployee, IsAdmin, IsAnyUser, IsHRorAdmin
from .serializers import (
    PayrollSerializer,
    AttendanceSerializer,
    LeaveRequestSerializer,
    PayrollGenerateSerializer,
    PayrollStatusUpdateSerializer,
    LeaveStatusUpdateSerializer,
    BulkAttendanceSerializer,
    HolidaySerializer
)
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response


# Only HR manages salary
# GeneratePayrollView will now use salary from profiles.

class AttendanceSaveView(APIView):
    """
    Handles saving bulk attendance data from React frontend json.
    Expected JSON: 
    [
        {"userid": "1770984055671", "attendance": [{"date": "2026-02-16", "status": true}]},
        ...
    ]
    """
    def post(self, request, *args, **kwargs):
        data = request.data
        
        # Manually invoke the serializer to validate and create/update
        # The logic is encapsulated in the serializer's create method
        serializer = BulkAttendanceSerializer(data={'attendance_data': data})
        
        if serializer.is_valid():
            try:
                # This will call .create() inside your BulkAttendanceSerializer
                serializer.save()
                return Response({"message": "Successfully updated all attendance records."}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AttendanceListView(APIView):
    """
    Example view to fetch ALL current attendance in a JSON format similar to what frontend expects.
    This can be used to re-hydrate state when page loads.
    
    Response format:
    {
        "varsha@gmail.com": [
            {"date": "2026-02-16", "status": true},
            ...
        ]
    }
    """
    def get(self, request, *args, **kwargs):
        # Fetch all, sort by date
        queryset = Attendance.objects.all().select_related('user').order_by('date')
        
        # Build dictionary response {employee_id: [records]}
        response_data = {}
        for record in queryset:
            if not record.user or not record.user.employee_id:
                continue
            emp_key = str(record.user.employee_id)
            if emp_key not in response_data:
                response_data[emp_key] = []
            
            response_data[emp_key].append({
                "date": record.date.strftime("%Y-%m-%d"),
                "status": record.is_present
            })
            
        return Response(response_data)


class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Attendance.objects.none()
        if user.role == 'EMPLOYEE':
            return Attendance.objects.filter(user=user)
        return Attendance.objects.all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAnyUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data.get('user')
        date = serializer.validated_data.get('date')
        defaults = {
            'is_present': serializer.validated_data.get('is_present', False),
        }
        
        obj, created = Attendance.objects.update_or_create(
            user=user,
            date=date,
            defaults=defaults
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            AttendanceSerializer(obj).data, 
            status=201 if created else 200, 
            headers=headers
        )


class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated] # Custom logic in get_object or check_object_permissions
    lookup_field = 'user__employee_id'
    lookup_url_kwarg = 'employee_id'

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('employee_id', openapi.IN_PATH, type=openapi.TYPE_STRING, description="Numeric User ID of the employee")
        ],
        responses={200: AttendanceSerializer}
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_object(self):
        identifier = self.kwargs.get(self.lookup_url_kwarg)
        # Check permissions: HR/Admin can see any, Employee can only see self
        if self.request.user.role == 'EMPLOYEE' and self.request.user.employee_id != identifier and self.request.user.username != identifier:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only view your own attendance.")
            
        try:
            # Try finding by employee_id (numeric)
            return Attendance.objects.filter(user__employee_id=identifier).latest('date', 'id')
        except Attendance.DoesNotExist:
            try:
                # Try finding by username (email)
                return Attendance.objects.filter(user__username=identifier).latest('date', 'id')
            except Attendance.DoesNotExist:
                from django.http import Http404
                raise Http404("No attendance record found for this user identifier.")


# Leave
class LeaveListCreateView(generics.ListCreateAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return LeaveRequest.objects.none()
        queryset = LeaveRequest.objects.all()
        
        # 1. Base filtering by role
        if user.role == 'EMPLOYEE':
            queryset = queryset.filter(user=user)
        
        # 2. Optional filtering by userid (employee_id) or username
        userid = self.request.query_params.get('userid')
        username = self.request.query_params.get('username')
        
        if userid:
            queryset = queryset.filter(user__employee_id=userid)
        if username:
            queryset = queryset.filter(user__username=username)
        
        return queryset

    @swagger_auto_schema(
        operation_description="Create or List leave requests. Uses form-data to provide dropdowns for leave_type.",
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LeaveDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return LeaveRequest.objects.none()
        if user.role == 'EMPLOYEE':
            return LeaveRequest.objects.filter(user=user)
        return LeaveRequest.objects.all()

    def get_object(self):
        # The PK from URL can be a record ID (int) or a user identifier (string)
        pk = self.kwargs.get('pk')
        user = self.request.user
        
        leave = None
        
        # 1. Try finding by record PK if it's numeric/digit
        if str(pk).isdigit():
            try:
                leave = LeaveRequest.objects.get(pk=pk)
            except LeaveRequest.DoesNotExist:
                pass
                
        # 2. If not found, try finding the LATEST leave for user identifier (employee_id or username)
        if not leave:
            try:
                from django.db.models import Q
                leave = LeaveRequest.objects.filter(
                    Q(user__employee_id=pk) | Q(user__username=pk)
                ).order_by('-id').first()
                if not leave:
                    raise LeaveRequest.DoesNotExist
            except LeaveRequest.DoesNotExist:
                from django.http import Http404
                raise Http404("No leave request found for this ID or identifier.")
        
        # 3. Check permissions
        if user.role == 'EMPLOYEE' and leave.user != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to view this leave request.")
            
        return leave


class GeneratePayrollView(APIView):
    permission_classes = [IsAuthenticated, IsHRorAdmin]
    parser_classes = [MultiPartParser, FormParser]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('employee', openapi.IN_FORM, type=openapi.TYPE_STRING, required=True, description="Login ID (Username) of the employee"),
            openapi.Parameter('month', openapi.IN_FORM, type=openapi.TYPE_STRING, required=True, description="Month name (e.g. January)"),
            openapi.Parameter('year', openapi.IN_FORM, type=openapi.TYPE_INTEGER, required=True, description="Year (e.g. 2026)"),
            openapi.Parameter('pay', openapi.IN_FORM, type=openapi.TYPE_STRING, required=False, enum=['PENDING', 'PAID', 'UNPAID'], default='UNPAID', description="Payment status")
        ],
        responses={200: PayrollSerializer}
    )
    def post(self, request):
        # 1. Validate with Serializer (Ensures types like year: int)
        serializer = PayrollGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
            
        username = serializer.validated_data.get("employee")
        month_name = serializer.validated_data.get("month")
        year = serializer.validated_data.get("year")
        pay_status = serializer.validated_data.get('pay', 'UNPAID')

        # 2. Map Month Name to Number
        months_map = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        month_num = months_map.get(month_name)
        if not month_num:
            return Response({"error": "Invalid month name"}, status=400)

        # 3. Get User and Profile
        try:
            from django.db.models import Q
            target_user = User.objects.get(Q(username=username) | Q(employee_id=username))
            
            if target_user.role == 'HR':
                from hr.models import HRProfile
                try:
                    profile = HRProfile.objects.get(user=target_user)
                except HRProfile.DoesNotExist:
                    return Response({"error": f"HR profile for {username} not found"}, status=404)
            else:
                try:
                    profile = EmployeeProfile.objects.get(user=target_user)
                except EmployeeProfile.DoesNotExist:
                    return Response({"error": f"Employee profile for {username} not found"}, status=404)
                    
        except User.DoesNotExist:
            return Response({"error": "User with this Login ID not found"}, status=404)
        
        # 4. Get Salary and Allowances from Profile
        base_salary = getattr(profile, 'salary', 0)
        allowances = getattr(profile, 'allowances', 0)

        # 5. Calculate Leaves (LOP vs CASUAL)
        approved_leaves = LeaveRequest.objects.filter(
            user=target_user,
            status='APPROVED',
            start_date__year=year,
            start_date__month=month_num
        )
        
        lop_days = 0
        casual_days = 0
        for leave in approved_leaves:
            days = (leave.end_date - leave.start_date).days + 1
            if leave.leave_type == 'LOP':
                lop_days += days
            else:
                casual_days += days

        # 6. Compute
        import calendar
        total_days = calendar.monthrange(year, month_num)[1]
        
        per_day = base_salary / total_days
        lop_amount = per_day * lop_days
        
        total_deductions = lop_amount
        total_salary = (base_salary + allowances) - total_deductions

        # 7. Create record
        payroll = Payroll.objects.create(
            user=target_user,
            month=month_name,
            year=year,
            total_days=total_days,
            present_days=total_days - lop_days - casual_days,
            lop_days=lop_days,
            casual_days=casual_days,
            salary_per_day=per_day,
            basic_salary=base_salary,
            allowances=allowances,
            deductions=total_deductions,
            total_salary=total_salary,
            pay=pay_status,
            paid_at=timezone.now() if pay_status == 'PAID' else None
        )
    
        return Response(PayrollSerializer(payroll).data)

class PayrollListView(generics.ListAPIView):
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payroll.objects.none()
        if user.role == 'EMPLOYEE':
            return Payroll.objects.filter(user=user, pay='PAID')
        return Payroll.objects.all()

class PayrollDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payroll.objects.none()
        if user.role == 'EMPLOYEE':
            return Payroll.objects.filter(user=user, pay='PAID')
        return Payroll.objects.all()

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsHRorAdmin])
@swagger_auto_schema(
    request_body=LeaveStatusUpdateSerializer,
    responses={200: "Leave updated"}
)
def approve_leave(request, pk):
    leave = None
    
    # 1. Try finding by Leave ID if it's numeric
    if str(pk).isdigit():
        try:
            leave = LeaveRequest.objects.get(pk=pk)
        except LeaveRequest.DoesNotExist:
            pass

    # 2. Try finding the latest pending leave for this employee identifier (Username or Employee ID)
    if not leave:
        try:
            from django.db.models import Q
            leave = LeaveRequest.objects.filter(
                Q(user__username=pk) | Q(user__employee_id=pk),
                status='PENDING'
            ).latest('id')
        except (LeaveRequest.DoesNotExist, Exception):
            return Response({"error": "No pending leave found for this ID or identifier"}, status=404)

    status = request.data.get("status")
    message = request.data.get("message")
    leave.status = status
    leave.admin_comment = message
    leave.approved_by = request.user
    leave.save()

    return Response({"message": f"Leave status updated to {status}"})



@api_view(['POST'])
@permission_classes([IsAuthenticated, IsHRorAdmin])
@swagger_auto_schema(
    manual_parameters=[
        openapi.Parameter('month', openapi.IN_QUERY, type=openapi.TYPE_STRING, description="Month name (required if using employee ID)"),
        openapi.Parameter('year', openapi.IN_QUERY, type=openapi.TYPE_INTEGER, description="Year (required if using employee ID)")
    ],
    responses={200: PayrollSerializer}
)
def pay_payroll(request, pk):
    """
    Dedicated endpoint for the 'Pay' button.
    Supports both:
    1. Payroll Record ID (e.g. 1)
    2. Employee Login ID (e.g. EMP-2026-0005) - Finds the record for specified/latest month.
    """
    payroll = None
    
    # 1. Try finding by Payroll ID if it's numeric
    if str(pk).isdigit():
        try:
            payroll = Payroll.objects.get(pk=pk)
        except Payroll.DoesNotExist:
            pass

    # 2. Try finding by employee identifier (Username or Employee ID) + month/year
    if not payroll:
        month = request.data.get('month') or request.query_params.get('month')
        year = request.data.get('year') or request.query_params.get('year')
        
        try:
            from django.db.models import Q
            queryset = Payroll.objects.filter(
                Q(user__username=pk) | Q(user__employee_id=pk)
            )
            
            if month and year:
                payroll = queryset.filter(month=month, year=year).latest('generated_at')
            else:
                # Fallback to latest pending if month/year not provided
                payroll = queryset.filter(pay__in=['PENDING', 'UNPAID']).latest('generated_at')
                
        except Payroll.DoesNotExist:
            msg = f"No payroll found for employee '{pk}'"
            if month and year:
                msg += f" for {month} {year}."
            else:
                msg += " with pending status."
            return Response({"error": msg}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    # 1. Simulate Payment (Logging) - Find relevant profile for info
    target_user = payroll.user
    profile = None
    try:
        profile = target_user.employeeprofile
    except Exception:
        try:
            profile = target_user.hrprofile
        except Exception:
            pass
            
    print(f"--- PAYMENT TRANSACTION INITIATED (Button Click) ---")
    if profile:
        print(f"To: {profile.name}")
        print(f"Bank: {profile.bank_name}, Account: {profile.account_number}, IFSC: {profile.ifsc_code}")
    else:
        print(f"To: {target_user.username} (Profile missing)")
    print(f"Amount: {payroll.total_salary}")
    print(f"--------------------------------------------------")

    # 2. Update Status
    payroll.pay = 'PAID'
    payroll.paid_at = timezone.now()
    payroll.save()

    return Response(PayrollSerializer(payroll).data)


class HolidayListCreateView(generics.ListCreateAPIView):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsHRorAdmin()]
        return [IsAuthenticated()]

class HolidayDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated, IsHRorAdmin]
