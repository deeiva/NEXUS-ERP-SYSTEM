from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date
from enum import Enum

class RoleEnum(str, Enum):
    HR = "HR"
    EMPLOYEE = "EMPLOYEE"
    ADMIN = "ADMIN"

class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum
    
    mobile: str
    address: str
    qualification: str
    joining_date: Optional[date] = None
    salary: float
    department: str # Name of the department
    
    # Image handling in FastAPI is different (UploadFile), 
    # but for JSON body we might skip it or handle multipart separately.
    # For simplicity in this step, we'll keep it as optional string URL or skip.
    
class UserLoginSchema(BaseModel):
    username: str
    password: str

class TokenSchema(BaseModel):
    access: str
    refresh: str
    role: str
