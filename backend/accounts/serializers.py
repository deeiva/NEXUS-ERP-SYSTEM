from rest_framework import serializers
from .models import User
from hr.models import HRProfile
from employees.models import EmployeeProfile, Department

class UserSerializer(serializers.ModelSerializer):
    # Read: returns human-readable values via get_* methods
    # Write: the same field names are accepted as input and forwarded to the profile in update()
    name = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    department_id = serializers.PrimaryKeyRelatedField(    # writable FK by PK
        queryset=Department.objects.all(),
        source='department',
        required=False,
        write_only=True,
        allow_null=True,
    )
    mobile = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    qualification = serializers.CharField(required=False, allow_blank=True)
    joining_date = serializers.SerializerMethodField()
    salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    allowances = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    bank_name = serializers.CharField(required=False, allow_blank=True)
    account_number = serializers.CharField(required=False, allow_blank=True)
    ifsc_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'role', 'employee_id',
            'name', 'department', 'department_id', 'mobile',
            'address', 'qualification', 'joining_date',
            'salary', 'allowances', 'bank_name', 'account_number', 'ifsc_code',
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def _get_profile_attr(self, obj, attr_name):
        try:
            if obj.role == 'HR' and hasattr(obj, 'hrprofile'):
                return getattr(obj.hrprofile, attr_name, "")
            elif obj.role == 'EMPLOYEE' and hasattr(obj, 'employeeprofile'):
                return getattr(obj.employeeprofile, attr_name, "")
        except Exception:
            pass
        return ""

    # Override to_representation so that read-only profile fields that are
    # now CharField still return the actual profile value when reading.
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        profile_fields = ('name', 'mobile', 'address', 'qualification',
                          'salary', 'allowances', 'bank_name', 'account_number', 'ifsc_code')
        for field in profile_fields:
            ret[field] = self._get_profile_attr(instance, field)
            
        # Ensure department returns name string
        ret['department'] = self.get_department(instance)
        return ret

    def get_name(self, obj):
        return self._get_profile_attr(obj, 'name')

    def get_department(self, obj):
        try:
            if obj.role == 'HR' and hasattr(obj, 'hrprofile') and obj.hrprofile.department:
                return obj.hrprofile.department.name
            elif obj.role == 'EMPLOYEE' and hasattr(obj, 'employeeprofile') and obj.employeeprofile.department:
                return obj.employeeprofile.department.name
        except Exception:
            pass
        return ""

    def get_mobile(self, obj):
        return self._get_profile_attr(obj, 'mobile')

    def get_address(self, obj):
        return self._get_profile_attr(obj, 'address')
        
    def get_qualification(self, obj):
        return self._get_profile_attr(obj, 'qualification')

    def get_joining_date(self, obj):
        return self._get_profile_attr(obj, 'joining_date')

    def get_salary(self, obj):
        return self._get_profile_attr(obj, 'salary')

    def get_bank_name(self, obj):
        return self._get_profile_attr(obj, 'bank_name')

    def get_account_number(self, obj):
        return self._get_profile_attr(obj, 'account_number')

    def get_ifsc_code(self, obj):
        return self._get_profile_attr(obj, 'ifsc_code')

    def update(self, instance, validated_data):
        """
        Handle PATCH/PUT on a User and propagate profile field changes
        to the related EmployeeProfile or HRProfile.
        """
        # --- User-level fields ---
        if 'email' in validated_data:
            instance.email = validated_data.pop('email')
            instance.username = instance.email  # keep username in sync
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))

        # --- Resolve department ---
        # Accept either a Department PK (int) or department name (str)
        department = validated_data.pop('department', None)
        if department:
            if isinstance(department, str) and department.isdigit():
                department = int(department)
            
            if isinstance(department, int):
                try:
                    department = Department.objects.get(pk=department)
                except Department.DoesNotExist:
                    department = None
            elif isinstance(department, str):
                try:
                    department = Department.objects.get(name__iexact=department)
                except Department.DoesNotExist:
                    # Optional: create if not exists or just set to None
                    department = None
        else:
            department = None

        # Fields that live on the profile, not on User
        profile_field_names = [
            'name', 'mobile', 'address', 'qualification',
            'salary', 'allowances',
            'bank_name', 'account_number', 'ifsc_code',
        ]
        profile_data = {k: validated_data.pop(k) for k in profile_field_names if k in validated_data}
        if department is not None:
            profile_data['department'] = department

        # --- Update User instance ---
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # --- Update the linked profile ---
        try:
            if instance.role == 'HR':
                profile = instance.hrprofile
            else:
                profile = instance.employeeprofile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        except Exception:
            pass  # Profile doesn't exist yet — silently skip

        return instance


class RegisterSerializer(serializers.Serializer):

    # Common fields
    name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['HR', 'EMPLOYEE'])
    employee_id = serializers.CharField(read_only=True)
    
    # Profile fields
    mobile = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False)
    qualification = serializers.CharField(required=False)
    salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    allowances = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    department = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False)

    # Bank fields
    bank_name = serializers.CharField(required=False, allow_blank=True)
    account_number = serializers.CharField(required=False, allow_blank=True)
    ifsc_code = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        from django.db import transaction
        import random

        role = validated_data.pop('role')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        name = validated_data.pop('name')
        
        # Optional fields with defaults
        employee_id = validated_data.pop('employee_id', None)
        mobile = validated_data.pop('mobile', "")
        address = validated_data.pop('address', "")
        qualification = validated_data.pop('qualification', "")
        salary = validated_data.pop('salary', 20000.00)
        allowances = validated_data.pop('allowances', 0.00)
        dept_raw = validated_data.pop('department', None)
        image = validated_data.pop('image', None)
        
        # --- Resolve department (ID or Name) ---
        department = None
        if dept_raw:
            if isinstance(dept_raw, str) and dept_raw.isdigit():
                dept_raw = int(dept_raw)
                
            if isinstance(dept_raw, int):
                try:
                    department = Department.objects.get(pk=dept_raw)
                except Department.DoesNotExist:
                    pass
            elif isinstance(dept_raw, str):
                try:
                    department = Department.objects.get(name__iexact=dept_raw)
                except Department.DoesNotExist:
                    # If registering HR and department doesn't exist, maybe create it
                    if role == 'HR' and dept_raw.lower() in ['hr', 'human resources']:
                        department = Department.objects.create(name='Human Resources')
                    else:
                        pass
        
        # Bank details
        bank_name = validated_data.pop('bank_name', "")
        account_number = validated_data.pop('account_number', "")
        ifsc_code = validated_data.pop('ifsc_code', "")

        # --- AUTO-GENERATE UNIQUE EMPLOYEE_ID ---
        employee_id = f"177{random.randint(1000000000, 9999999999)}"
        while User.objects.filter(employee_id=employee_id).exists():
            employee_id = f"177{random.randint(1000000000, 9999999999)}"

        with transaction.atomic():
            # 1. Create User
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                role=role,
                employee_id=employee_id
            )

            # 2. Create Profile based on role
            if role == 'HR':
                HRProfile.objects.create(
                    user=user,
                    name=name,
                    mobile=mobile,
                    address=address,
                    department=department,
                    qualification=qualification,
                    salary=salary,
                    allowances=allowances,
                    image=image,
                    bank_name=bank_name,
                    account_number=account_number,
                    ifsc_code=ifsc_code
                )
            elif role == 'EMPLOYEE':
                EmployeeProfile.objects.create(
                    user=user,
                    name=name,
                    mobile=mobile,
                    address=address,
                    department=department,
                    qualification=qualification,
                    salary=salary,
                    allowances=allowances,
                    image=image,
                    bank_name=bank_name,
                    account_number=account_number,
                    ifsc_code=ifsc_code
                )

            return user
