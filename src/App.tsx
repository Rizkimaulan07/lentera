import type { ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuth } from '@/providers/auth-provider'
import { LoginPage } from '@/features/auth/login-page'
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { ScanPage } from '@/features/attendance/scan-page'
import { ScanParticipantPage } from '@/features/attendance/scan-participant-page'
import { ParticipantQrPage } from '@/features/attendance/participant-qr-page'
import { QrDisplayPage } from '@/features/attendance/qr-display-page'
import { AttendancePage } from '@/features/attendance/attendance-page'
import { ActivitiesPage } from '@/features/activities/activities-page'
import { ParticipantsPage } from '@/features/participants/participants-page'
import { ParticipantDetailPage } from '@/features/participants/participant-detail-page'
import { LeavesPage } from '@/features/leaves/leaves-page'
import { JournalsPage } from '@/features/journals/journals-page'
import { AssessmentsPage } from '@/features/assessments/assessments-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { AnnouncementsPage } from '@/features/announcements/announcements-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { AdminUsersPage } from '@/features/admin/users-page'
import { AdminMasterPage } from '@/features/admin/master-page'
import { AdminSettingsPage } from '@/features/admin/settings-page'
import { AdminLogsPage } from '@/features/admin/logs-page'
import { NotFoundPage } from '@/features/not-found-page'
import type { Role } from '@/types'

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: ReactNode
}) {
  const { user } = useAuth()
  if (!user) return null
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route
              path="scan"
              element={
                <RequireRole roles={['participant']}>
                  <ScanPage />
                </RequireRole>
              }
            />
            <Route
              path="my-qr"
              element={
                <RequireRole roles={['participant']}>
                  <ParticipantQrPage />
                </RequireRole>
              }
            />
            <Route
              path="scan-peserta"
              element={
                <RequireRole roles={['supervisor', 'teacher', 'admin']}>
                  <ScanParticipantPage />
                </RequireRole>
              }
            />
            <Route
              path="qr"
              element={
                <RequireRole roles={['supervisor', 'admin']}>
                  <QrDisplayPage />
                </RequireRole>
              }
            />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route
              path="participants"
              element={
                <RequireRole roles={['supervisor', 'teacher', 'admin']}>
                  <ParticipantsPage />
                </RequireRole>
              }
            />
            <Route
              path="participants/:id"
              element={
                <RequireRole roles={['supervisor', 'teacher', 'admin', 'participant']}>
                  <ParticipantDetailPage />
                </RequireRole>
              }
            />
            <Route path="leaves" element={<LeavesPage />} />
            <Route path="journals" element={<JournalsPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route
              path="reports"
              element={
                <RequireRole roles={['supervisor', 'teacher', 'admin']}>
                  <ReportsPage />
                </RequireRole>
              }
            />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="admin/users"
              element={
                <RequireRole roles={['admin']}>
                  <AdminUsersPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/master"
              element={
                <RequireRole roles={['admin']}>
                  <AdminMasterPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/settings"
              element={
                <RequireRole roles={['admin']}>
                  <AdminSettingsPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/logs"
              element={
                <RequireRole roles={['admin']}>
                  <AdminLogsPage />
                </RequireRole>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
