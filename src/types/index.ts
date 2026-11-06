export type Role = 'admin' | 'supervisor' | 'teacher' | 'participant'

export interface User {
  id: string
  name: string
  username: string
  email: string
  password: string
  role: Role
  phone: string
  photo?: string
  active: boolean
  schoolId?: string
  divisionId?: string
  position?: string
  createdAt: string
}

export interface School {
  id: string
  name: string
  address: string
}

export interface Division {
  id: string
  name: string
  description?: string
}

export interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  active: boolean
}

export interface Participant {
  id: string
  userId: string
  nis: string
  schoolId: string
  major: string
  className: string
  divisionId: string
  periodId: string
  supervisorId: string
  teacherId: string
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'sick'

export interface Attendance {
  id: string
  participantId: string
  date: string
  checkIn?: string
  checkOut?: string
  status: AttendanceStatus
  method: 'qr' | 'manual'
  lat?: number
  lng?: number
  deviceId?: string
  note?: string
}

export type ActivityType = 'sports' | 'dhuha' | 'meal'

export interface Activity {
  id: string
  name: string
  type: ActivityType
  days: number[]
  startTime: string
  endTime: string
  active: boolean
  mandatory: boolean
}

export interface ActivityAttendance {
  id: string
  activityId: string
  participantId: string
  date: string
  status: 'present' | 'absent' | 'leave'
  scannedAt?: string
}

export type LeaveType = 'sick' | 'family' | 'school' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  participantId: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
  attachmentName?: string
  status: LeaveStatus
  decidedBy?: string
  decisionNote?: string
  createdAt: string
}

export type JournalStatus = 'pending' | 'approved' | 'revision'

export interface Journal {
  id: string
  participantId: string
  date: string
  activity: string
  description: string
  duration: number
  obstacle?: string
  photoName?: string
  status: JournalStatus
  comment?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}

export interface AssessmentComponent {
  id: string
  name: string
  weight: number
  auto?: 'attendance'
}

export interface Assessment {
  id: string
  participantId: string
  assessorId: string
  stage: 'mid' | 'final'
  scores: Record<string, number>
  status: 'draft' | 'final'
  updatedAt: string
}

export type AnnouncementAudience = 'all' | Role

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  createdBy: string
  createdAt: string
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
  href?: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  object: string
  detail: string
  at: string
}

export interface AttendanceSettings {
  checkInStart: string
  lateLimit: string
  checkOutTime: string
  latitude: number
  longitude: number
  radius: number
  qrDuration: number
  workDays: number[]
}

export type QrType = 'attendance' | ActivityType

export interface QrSession {
  token: string
  type: QrType
  createdBy: string
  createdAt: string
  expiresAt: string
}

export interface AppData {
  users: User[]
  schools: School[]
  divisions: Division[]
  periods: Period[]
  participants: Participant[]
  attendances: Attendance[]
  activities: Activity[]
  activityAttendances: ActivityAttendance[]
  leaves: LeaveRequest[]
  journals: Journal[]
  assessmentComponents: AssessmentComponent[]
  assessments: Assessment[]
  announcements: Announcement[]
  notifications: AppNotification[]
  logs: ActivityLog[]
  settings: AttendanceSettings
}

export interface AttendanceSummary {
  total: number
  present: number
  late: number
  absent: number
  leave: number
  sick: number
  rate: number
}

export interface ScanResult {
  ok: boolean
  message: string
  kind: 'attendance' | 'activity'
  status?: string
  time?: string
  distance?: number
  activityName?: string
  detail?: string
}
