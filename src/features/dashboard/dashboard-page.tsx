import { useAuth } from '@/providers/auth-provider'
import { ParticipantDashboard } from '@/features/dashboard/participant-dashboard'
import { SupervisorDashboard } from '@/features/dashboard/supervisor-dashboard'
import { TeacherDashboard } from '@/features/dashboard/teacher-dashboard'
import { AdminDashboard } from '@/features/dashboard/admin-dashboard'

export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  if (user.role === 'participant') return <ParticipantDashboard />
  if (user.role === 'supervisor') return <SupervisorDashboard />
  if (user.role === 'teacher') return <TeacherDashboard />
  return <AdminDashboard />
}
