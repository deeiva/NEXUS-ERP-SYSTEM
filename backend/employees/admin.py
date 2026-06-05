from django.contrib import admin
from django.utils import timezone
from .models import Department, EmployeeProfile, Attendance, Payroll, LeaveRequest

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('user', 'pay', 'month', 'year', 'total_salary', 'paid_at', 'generated_at')
    list_editable = ('pay',)
    list_filter = ('pay', 'month', 'year')
    search_fields = ('user__username', 'month')
    actions = ['mark_as_paid', 'mark_as_pending']

    def mark_as_paid(self, request, queryset):
        queryset.update(pay='PAID', paid_at=timezone.now())
    mark_as_paid.short_description = "Mark selected as Paid"

    def mark_as_pending(self, request, queryset):
        queryset.update(pay='PENDING', paid_at=None)
    mark_as_pending.short_description = "Mark selected as Pending"

admin.site.register(Department)
admin.site.register(EmployeeProfile)
admin.site.register(Attendance)
# admin.site.register(SalaryStructure)
admin.site.register(LeaveRequest)
