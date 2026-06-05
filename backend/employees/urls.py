from django.urls import path
from .views import (
    AttendanceListCreateView, 
    AttendanceListCreateView,
    AttendanceDetailView,
    LeaveListCreateView,
    LeaveDetailView,
    GeneratePayrollView,
    PayrollListView,
    PayrollDetailView,
    approve_leave,
    pay_payroll,
    AttendanceSaveView, 
    AttendanceListView,
    HolidayListCreateView,
    HolidayDetailView
)


urlpatterns = [

    # Attendance
    path('attendance/', AttendanceListCreateView.as_view()),
    path('attendance/save/', AttendanceSaveView.as_view(), name='save-attendance'),
    path('attendance/list/', AttendanceListView.as_view(), name='list-attendance'),
    path('attendance/<str:employee_id>/', AttendanceDetailView.as_view()),

    # Leave
    path('leave/', LeaveListCreateView.as_view()),
    path('leave/<str:pk>/', LeaveDetailView.as_view()),
    path('leave/<pk>/approve/', approve_leave),

    # Payroll
    path('payroll/generate/', GeneratePayrollView.as_view()),
    path('payroll/', PayrollListView.as_view()),
    path('payroll/<int:pk>/', PayrollDetailView.as_view()),
    path('payroll/<pk>/pay/', pay_payroll),
    
    # Holiday
    path('holidays/', HolidayListCreateView.as_view()),
    path('holidays/<int:pk>/', HolidayDetailView.as_view()),
]







