import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/auth/Login';
import { useAuthStore } from './store/authStore';

import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LeadsPage } from './pages/admin/LeadsPage';
import { Users } from './pages/admin/Users';
import { Students } from './pages/admin/Students';
import { Groups } from './pages/admin/Groups';
import { GroupDetails } from './pages/admin/GroupDetails';
import { Rooms } from './pages/admin/Rooms';
import { Finance } from './pages/admin/Finance';
import { Settings } from './pages/admin/Settings';
import { Notifications } from './pages/admin/Notifications';
import { AttendancePage } from './pages/admin/AttendancePage';

import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherGroups } from './pages/teacher/TeacherGroups';
import { TeacherGroupDetails } from './pages/teacher/TeacherGroupDetails';
import { TeacherSchedule } from './pages/teacher/TeacherSchedule';
import { TeacherMaterials } from './pages/teacher/TeacherMaterials';
import { TeacherTests } from './pages/teacher/TeacherTests';
import { TeacherTestCreate } from './pages/teacher/TeacherTestCreate';
import { TeacherTestDetails } from './pages/teacher/TeacherTestDetails';
import { TeacherTestEdit } from './pages/teacher/TeacherTestEdit';
import { TeacherFinance } from './pages/teacher/TeacherFinance';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentMaterials } from './pages/student/StudentMaterials';
import { StudentSchedule } from './pages/student/StudentSchedule';
import { StudentTests } from './pages/student/StudentTests';
import { StudentTestTake } from './pages/student/StudentTestTake';
import { StudentFinance } from './pages/student/StudentFinance';
import { Profile } from './pages/common/Profile';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/auth/login" replace />;
  if (role !== allowedRole) return <Navigate to={`/${role}`} replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-900 font-sans selection:bg-blue-500/30">
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
          </Route>

          <Route element={<DashboardLayout />}>
            <Route path="/admin">
              <Route index element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="leads" element={
                <ProtectedRoute allowedRole="admin">
                  <LeadsPage />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute allowedRole="admin">
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="students" element={
                <ProtectedRoute allowedRole="admin">
                  <Students />
                </ProtectedRoute>
              } />
              <Route path="groups" element={
                <ProtectedRoute allowedRole="admin">
                  <Groups />
                </ProtectedRoute>
              } />
              <Route path="groups/:id" element={
                <ProtectedRoute allowedRole="admin">
                  <GroupDetails />
                </ProtectedRoute>
              } />
              <Route path="rooms" element={
                <ProtectedRoute allowedRole="admin">
                  <Rooms />
                </ProtectedRoute>
              } />
              <Route path="attendance" element={
                <ProtectedRoute allowedRole="admin">
                  <AttendancePage />
                </ProtectedRoute>
              } />
              <Route path="finance" element={
                <ProtectedRoute allowedRole="admin">
                  <Finance />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute allowedRole="admin">
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="notifications" element={
                <ProtectedRoute allowedRole="admin">
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute allowedRole="admin">
                  <Profile />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="/manager/*" element={
              <ProtectedRoute allowedRole="manager">
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="users" element={<Users />} />
                  <Route path="students" element={<Students />} />
                  <Route path="groups" element={<Groups />} />
                  <Route path="groups/:id" element={<GroupDetails />} />
                  <Route path="rooms" element={<Rooms />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="finance" element={<Finance />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            <Route path="/teacher/*" element={
              <ProtectedRoute allowedRole="teacher">
                <Routes>
                  <Route index element={<TeacherDashboard />} />
                  <Route path="groups" element={<TeacherGroups />} />
                  <Route path="groups/:id" element={<TeacherGroupDetails />} />
                  <Route path="schedule" element={<TeacherSchedule />} />
                  <Route path="materials" element={<TeacherMaterials />} />
                  <Route path="tests" element={<TeacherTests />} />
                  <Route path="tests/create" element={<TeacherTestCreate />} />
                  <Route path="tests/:id" element={<TeacherTestDetails />} />
                  <Route path="tests/:id/edit" element={<TeacherTestEdit />} />
                  <Route path="finance" element={<TeacherFinance />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            <Route path="/student/*" element={
              <ProtectedRoute allowedRole="student">
                <Routes>
                  <Route index element={<StudentDashboard />} />
                  <Route path="schedule" element={<StudentSchedule />} />
                  <Route path="materials" element={<StudentMaterials />} />
                  <Route path="tests" element={<StudentTests />} />
                  <Route path="tests/:id" element={<StudentTestTake />} />
                  <Route path="finance" element={<StudentFinance />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
