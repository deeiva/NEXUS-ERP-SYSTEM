from pydantic import BaseModel
from typing import Optional

class PayrollGenerateSchema(BaseModel):
    employee_id: int
    month: str
    year: int

class PayrollSchema(BaseModel):
    id: Optional[int] = None
    employee_id: int
    month: str
    year: int
    total_days: int
    present_days: int
    salary_per_day: float
    total_salary: float
    generated_at: str # Or datetime

    class Config:
        from_attributes = True
