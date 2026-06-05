from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0009_payroll_paid_at_payroll_status_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='payroll',
            old_name='status',
            new_name='pay',
        ),
    ]
