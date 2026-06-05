from rest_framework import serializers
from .models import HRProfile
from employees.models import Department

class HRProfileSerializer(serializers.ModelSerializer):
    department = serializers.SlugRelatedField(
        queryset=Department.objects.all(),
        slug_field='name'
    )

    class Meta:
        model = HRProfile
        fields = '__all__'
