import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Common/Login';
import Register from './Common/Register';
import AdminDashboard from './Admin/AdminDashboard';
import AdminLayout from './Admin/AdminLayout';
import HRDashboard from './Hr/HRDashboard';
import HRLayout from './Hr/HRLayout';
import EmployeeDashboard from './Employee/EmployeeDashboard';
import EmployeeLayout from './Employee/EmployeeLayout';
import AdminAttendance from './Admin/AdminAttendance';
import AdminLeaveRequests from './Admin/AdminLeaveRequests';
import HRLeaveRequests from './Hr/HRLeaveRequests';
import EmployeeLeaveRequests from './Employee/EmployeeLeaveRequests';
import EmployeePayslip from './Employee/PayslipEmp';
import HRPayslip from './Hr/PayslipHR';
import AdminPayroll from './Admin/AdminPayroll';
import AdminDepartments from './Admin/AdminDepartments';
import AdminUsers from './Admin/AdminUsers';
import Profile from './Common/Profile';
import HolidayManager from './Common/HolidayManager';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard with Sidebar/Navbar */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="add-hr" element={<Register />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="leave-requests" element={<AdminLeaveRequests />} />
          <Route path="payroll" element={<AdminPayroll />} />
          <Route path="add-department" element={<AdminDepartments />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="holidays" element={<HolidayManager />} />
        </Route>

        {/* HR Dashboard with Sidebar/Navbar */}
        <Route path="/hr-dashboard" element={<HRLayout />}>
          <Route index element={<HRDashboard />} />
          <Route path="add-employee" element={<Register />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="payroll" element={<AdminPayroll />} />
          <Route path="payslip" element={<HRPayslip />} />
          <Route path="view-employee" element={<AdminUsers />} />
          <Route path="leave-request" element={<HRLeaveRequests />} />
          <Route path="view-department" element={<AdminDepartments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="holidays" element={<HolidayManager />} />
        </Route>

        {/* Employee Dashboard with Sidebar/Navbar */}
        <Route path="/employee-dashboard" element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="leave-request" element={<EmployeeLeaveRequests />} />
          <Route path="payroll" element={<EmployeePayslip />} />
          <Route path="profile" element={<Profile />} />
          <Route path="holidays" element={<HolidayManager />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payroll" element={<AdminPayroll />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
