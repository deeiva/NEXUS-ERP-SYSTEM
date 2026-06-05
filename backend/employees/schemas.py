from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time

class DepartmentSchema(BaseModel):
    id: Optional[int] = None
    name: str

    class Config:
        from_attributes = True

class EmployeeProfileSchema(BaseModel):
    id: Optional[int] = None
    name: str
    mobile: str
    address: str
    qualification: str
    salary: float
    joining_date: date
    status: str
    department: Optional[DepartmentSchema] = None

    class Config:
        from_attributes = True

class AttendanceSchema(BaseModel):
    userid: str
    date: Optional[date] = None
    check_in: Optional[time] = None
    check_out: Optional[time] = None

    class Meta:
        from_attributes = True

class LeaveRequestSchema(BaseModel):
    id: Optional[int] = None
    employee_id: int
    start_date: date
    end_date: date
    reason: str
    status: str

    class Config:
        from_attributes = True
