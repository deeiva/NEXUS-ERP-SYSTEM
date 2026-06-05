import datetime
import random
from .models import User

def generate_unique_id(role):
    """
    Generates a unique User ID based on the role and current year.
    Format: 
        HR -> HR-YYYY-XXXX
        EMPLOYEE -> EMP-YYYY-XXXX
    """
    year = datetime.datetime.now().year
    prefix = "HR" if role == 'HR' else "EMP"
    
    # Get the last user with this prefix and year to determine the next sequence
    last_user = User.objects.filter(username__startswith=f"{prefix}-{year}").order_by('-username').first()
    
    if last_user:
        # Extract the sequence number (last 4 digits)
        last_id = last_user.username.split('-')[-1]
        new_sequence = int(last_id) + 1
    else:
        new_sequence = 1
        
    new_id = f"{prefix}-{year}-{new_sequence:04d}"
    
    # Paranoid check for collision (though unlikely with the above logic)
    while User.objects.filter(username=new_id).exists():
        new_sequence += 1
        new_id = f"{prefix}-{year}-{new_sequence:04d}"
        
    return new_id
