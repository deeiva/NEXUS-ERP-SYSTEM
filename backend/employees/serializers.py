from rest_framework import serializers
from accounts.models import User
from .models import (
    EmployeeProfile, 
    Department,
    Attendance, 
    Employee,
    LeaveRequest,
    Payroll,
    Holiday
)
from django.db.models import Q

class UserSlugRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        queryset = self.get_queryset()
        
        # 1. Try by numeric ID if data looks like an integer
        if str(data).isdigit():
            try:
                return queryset.get(id=data)
            except User.DoesNotExist:
                pass
        
        # 2. Try by the primary slug field (e.g. employee_id)
        try:
            return queryset.get(**{self.slug_field: data})
        except (User.DoesNotExist, ValueError, TypeError):
            pass

        # 3. Fallback to username (email)
        try:
            return queryset.get(username=data)
        except User.DoesNotExist:
            self.fail('does_not_exist', slug_name=self.slug_field, value=data)
        except (TypeError, ValueError):
            self.fail('invalid')


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = '__all__'


# ...

class AttendanceSerializer(serializers.ModelSerializer):
    userid = UserSlugRelatedField(
        slug_field='employee_id',
        queryset=User.objects.all(),
        source='user'
    )
    
    class Meta:
        model = Attendance
        fields = ['userid', 'date', 'is_present']
        validators = []
        
class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_id = UserSlugRelatedField(
        slug_field='employee_id',
        queryset=User.objects.all(),
        source='user'
    )
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    name = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField() # Keep for backward compatibility
    role = serializers.CharField(source='user.role', read_only=True)
    leave_type = serializers.ChoiceField(choices=LeaveRequest.leave_type_choices)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status = serializers.ChoiceField(choices=LeaveRequest.status_choices, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'user', 'employee_id', 'employee_name', 'name', 'role',
            'start_date', 'end_date', 'reason', 'admin_comment', 'leave_type', 'leave_type_display', 
            'status', 'status_display'
        ]

    def get_employee_name(self, obj):
        try:
            return obj.user.employeeprofile.name
        except Exception:
            try:
                return obj.user.hrprofile.name
            except Exception:
                return obj.user.username
    
    def get_name(self, obj):
        return self.get_employee_name(obj)

    def validate(self, data):
        user = data.get('user')
        leave_type = data.get('leave_type')
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # 1. Calculate requested days
        requested_days = (end_date - start_date).days + 1
        if requested_days > 1:
            raise serializers.ValidationError(
                f"You can only request 1 day of {leave_type} at a time (requested {requested_days} days)."
            )

        # 2. Check existing leaves in the same month/year
        month = start_date.month
        year = start_date.year

        existing_leaves = LeaveRequest.objects.filter(
            user=user,
            leave_type=leave_type,
            start_date__month=month,
            start_date__year=year
        ).exclude(status='REJECTED')

        total_existing_days = sum([(l.end_date - l.start_date).days + 1 for l in existing_leaves])

        if total_existing_days + requested_days > 1:
            raise serializers.ValidationError(
                f"Monthly limit reached: You already have {total_existing_days} day(s) of {leave_type} "
                f"approved or pending for {start_date.strftime('%B %Y')}. The limit is 1 day."
            )

        return data


class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    role = serializers.CharField(source='user.role', read_only=True)
    employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    employee = serializers.CharField(source='user.employee_id', read_only=True)

    def get_employee_name(self, obj):
        # Try to get name from EmployeeProfile or HRProfile
        try:
            return obj.user.employeeprofile.name
        except Exception:
            try:
                return obj.user.hrprofile.name
            except Exception:
                return obj.user.username

    class Meta:
        model = Payroll
        fields = [
            'id', 'user', 'employee_id', 'employee', 'employee_name', 'role', 'month', 'year', 
            'total_days', 'present_days', 'lop_days', 'casual_days', 'salary_per_day', 
            'basic_salary', 'allowances', 'deductions', 'total_salary',
            'pay', 'paid_at', 'generated_at'
        ]


class PayrollStatusUpdateSerializer(serializers.Serializer):
    pay = serializers.ChoiceField(choices=[('PENDING', 'Pending'), ('PAID', 'Paid'), ('UNPAID', 'Unpaid')])


class LeaveStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=LeaveRequest.status_choices)


class PayrollGenerateSerializer(serializers.Serializer):
    employee = serializers.CharField(help_text="Login ID (Username) of the employee")
    month = serializers.CharField(max_length=20)
    year = serializers.IntegerField()
    pay = serializers.ChoiceField(
        choices=[('PENDING', 'Pending'), ('PAID', 'Paid'), ('UNPAID', 'Unpaid')],
        default='UNPAID',
        required=False,
        help_text="Payment status (optional, defaults to Unpaid)"
    )

class AttendanceItemSerializer(serializers.Serializer):
    date = serializers.DateField()
    status = serializers.BooleanField()

class BulkAttendanceSerializer(serializers.Serializer):
    attendance_data = serializers.ListField()

    def create(self, validated_data):
        from accounts.models import User
        attendance_data = validated_data.get('attendance_data')
        
        for entry in attendance_data:
            emp_id = entry.get('userid')
            records = entry.get('attendance', [])
            
            try:
                # Robust lookup: Check ID (if numeric), employee_id, or username
                from django.db.models import Q
                query = Q(employee_id=emp_id) | Q(username=emp_id)
                if str(emp_id).isdigit():
                    query |= Q(id=emp_id)
                user = User.objects.filter(query).first()
                if not user:
                    continue
            except Exception:
                continue
                
            for rec in records:
                date = rec.get('date')
                status = rec.get('status', False)
                
                Attendance.objects.update_or_create(
                    user=user,
                    date=date,
                    defaults={'is_present': status}
                )
        return {} # Dummy return


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'
