# hr/urls.py
from django.urls import path
from .views import (DepartmentListCreateView, 
                    DepartmentDetailView, 
                    AttendanceSummaryView,
                    PayrollReportView,
                    DepartmentWorkforceView,
                    AttendanceTrendsView,
                    CompanyStatsView
                    )

urlpatterns = [
    path('departments/', DepartmentListCreateView.as_view()),
    path('departments/<int:pk>/', DepartmentDetailView.as_view()),
    path('attendance-summary/', AttendanceSummaryView.as_view()),
    path('payroll-report/', PayrollReportView.as_view()),
    path('attendance-trends/', AttendanceTrendsView.as_view()),
    path('company-stats/', CompanyStatsView.as_view()),
]
