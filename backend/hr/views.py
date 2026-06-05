import datetime
from rest_framework import generics
from employees.serializers import DepartmentSerializer
from rest_framework.permissions import IsAuthenticated  
from accounts.permissions import IsAdmin, IsAnyUser, IsHRorAdmin
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from employees.models import Attendance, EmployeeProfile, Payroll, Department
from django.db import models


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsHRorAdmin]


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsHRorAdmin]

class AttendanceSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsHRorAdmin]  

    def get(self, request):
        from hr.models import HRProfile
        summary = []
        
        # 1. Process Employees
        employees = EmployeeProfile.objects.all()
        for emp in employees:
            total_days = Attendance.objects.filter(
                user=emp.user, 
                date__gte=emp.joining_date
            ).count()

            summary.append({
                "name": emp.name,
                "role": "EMPLOYEE",
                "joining_date": emp.joining_date,
                "total_days": total_days
            })

        # 2. Process HR Staff
        hrs = HRProfile.objects.all()
        for hr_staff in hrs:
            total_days = Attendance.objects.filter(
                user=hr_staff.user, 
                date__gte=hr_staff.joining_date
            ).count()

            summary.append({
                "name": hr_staff.name,
                "role": "HR",
                "joining_date": hr_staff.joining_date,
                "total_days": total_days
            })

        return Response(summary)
    
    
class PayrollReportView(APIView):
    permission_classes = [IsAuthenticated, IsHRorAdmin]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('month', openapi.IN_QUERY, description="Month name (e.g. January)", type=openapi.TYPE_STRING),
            openapi.Parameter('year', openapi.IN_QUERY, description="Year (e.g. 2026)", type=openapi.TYPE_INTEGER),
        ],
        responses={200: openapi.Response("Payroll report summary")}
    )
    def get(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        payrolls = Payroll.objects.all()
        if month:
            payrolls = payrolls.filter(month=month)
        if year:
            payrolls = payrolls.filter(year=year)

        total_expenditure = sum([p.total_salary for p in payrolls])

        report = {
            "month": month,
            "year": year,
            "total_expenditure": total_expenditure
        }

        return Response(report)
    
    
class DepartmentWorkforceView(APIView):
    permission_classes = [IsAuthenticated, IsHRorAdmin]

    def get(self, request):
        departments = Department.objects.all()
        data = []

        for dept in departments:
            employees = EmployeeProfile.objects.filter(department=dept)
            total_employees = employees.count()
            avg_salary = employees.aggregate(avg=models.Avg('salary'))['avg'] or 0
            data.append({
                "department": dept.name,
                "total_employees": total_employees,
                "average_salary": avg_salary
            })
        return Response(data)
    
class AttendanceTrendsView(APIView):
    permission_classes = [IsAuthenticated, IsHRorAdmin]

    @swagger_auto_schema(
        responses={200: openapi.Response("Monthly attendance counts for the current year")}
    )
    def get(self, request):
        year = datetime.datetime.now().year
        # Group by month and count attendance records
        data = Attendance.objects.filter(date__year=year).values('date__month').annotate(count=models.Count('id')).order_by('date__month')
        
        # Format the response for easier reading
        trends = []
        for entry in data:
            trends.append({
                "month": datetime.date(year, entry['date__month'], 1).strftime('%B'),
                "count": entry['count']
            })
            
        return Response(trends)


class CompanyStatsView(APIView):
    permission_classes = [IsAuthenticated, IsHRorAdmin]

    @swagger_auto_schema(
        responses={200: openapi.Response("High-level dashboard statistics")}
    )
    def get(self, request):
        now = datetime.datetime.now()
        current_month = now.strftime('%B')
        current_year = now.year

        total_employees = EmployeeProfile.objects.count()
        total_depts = Department.objects.count()
        
        # Monthly expenditure
        monthly_payroll = Payroll.objects.filter(month=current_month, year=current_year).aggregate(total=models.Sum('total_salary'))['total'] or 0

        return Response({
            "total_employees": total_employees,
            "total_departments": total_depts,
            "monthly_payroll_expenditure": monthly_payroll,
            "current_month": current_month
        })
