from django.db import models
from django.conf import settings
from django.utils import timezone

class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class EmployeeProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    address = models.TextField()
    qualification = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    joining_date = models.DateField(default=timezone.now)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    image = models.ImageField(upload_to='employee_images/', null=True, blank=True)

    # Bank Details
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    account_number = models.CharField(max_length=50, null=True, blank=True)
    ifsc_code = models.CharField(max_length=20, null=True, blank=True)


# SalaryStructure removed - salary/allowances now on profiles.
class Employee(models.Model):
    """
    Your existing Employee model.
    You can customize this to include other fields like email, phone, etc.
    The `employee_id` corresponds to the unique ID (like '1770984055671') sent from the frontend.
    """
    full_name = models.CharField(max_length=255)
    employee_id = models.CharField(max_length=50, unique=True, help_text="Unique ID from frontend/localStorage")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.employee_id})"


class Attendance(models.Model):
    """
    Stores one record per employee per day.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records', null=False)
    date = models.DateField()
    is_present = models.BooleanField(default=False)
    
    # Optional: track when this record was updated
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Prevent duplicate entries for the same user on the same day
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        status = "Present" if self.is_present else "Absent"
        return f"{self.date}: {self.user.username} - {status}"


class LeaveRequest(models.Model):
    status_choices = (
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected')
    )
    leave_type_choices = (
        ('CASUAL', 'Casual Leave'),
        ('LOP', 'Loss of Pay')
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    leave_type = models.CharField(
        max_length=20,
        choices=leave_type_choices,
        default='CASUAL'
    )
    status = models.CharField(
        max_length=20,
        choices=status_choices,
        default='PENDING'
    )
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    admin_comment = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"

class Payroll(models.Model):
    status_choices = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('UNPAID', 'Unpaid')
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payrolls')
    month = models.CharField(max_length=20)
    year = models.IntegerField()

    total_days = models.IntegerField()
    present_days = models.IntegerField()
    lop_days = models.IntegerField(default=0)
    casual_days = models.IntegerField(default=0)
    salary_per_day = models.DecimalField(max_digits=10, decimal_places=2)

    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_salary = models.DecimalField(max_digits=10, decimal_places=2)  # This is the Net Salary

    pay = models.CharField(max_length=20, choices=status_choices, default='UNPAID')
    paid_at = models.DateTimeField(null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.name} - {self.month} {self.year} ({self.get_pay_display()})"
class Holiday(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField(unique=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.date})"

    class Meta:
        ordering = ['date']
