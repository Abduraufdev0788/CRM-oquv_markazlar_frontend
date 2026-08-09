import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/auth/Login';
import { useAuthStore } from './store/authStore';

import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Users } from './pages/admin/Users';
import { Students } from './pages/admin/Students';
import { Groups } from './pages/admin/Groups';
import { GroupDetails } from './pages/admin/GroupDetails';
import { Finance } from './pages/admin/Finance';
import { Settings } from './pages/admin/Settings';
import { FaceID } from './pages/admin/FaceID';
import { Notifications } from './pages/admin/Notifications';

import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherGroups } from './pages/teacher/TeacherGroups';
import { TeacherGroupDetails } from './pages/teacher/TeacherGroupDetails';
import { TeacherSchedule } from './pages/teacher/TeacherSchedule';
import { TeacherMaterials } from './pages/teacher/TeacherMaterials';
import { TeacherTests } from './pages/teacher/TeacherTests';
import { TeacherTestCreate } from './pages/teacher/TeacherTestCreate';
import { TeacherTestDetails } from './pages/teacher/TeacherTestDetails';
import { TeacherTestEdit } from './pages/teacher/TeacherTestEdit';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentMaterials } from './pages/student/StudentMaterials';
import { StudentSchedule } from './pages/student/StudentSchedule';
import { StudentTests } from './pages/student/StudentTests';
import { StudentTestTake } from './pages/student/StudentTestTake';
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
              <Route path="face-id" element={
                <ProtectedRoute allowedRole="admin">
                  <FaceID />
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
