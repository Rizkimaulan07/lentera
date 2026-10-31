import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Search,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { AttendanceBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  lowAttendanceParticipants,
  participantRecords,
  participantsForSupervisor,
  participantsForTeacher,
  todayAttendance,
} from '@/lib/analytics'
import {
  cn,
  summarizeAttendance,
} from '@/lib/utils'

export function ParticipantsPage() {
  const { user } = useAuth()
  const { data } = useData()
  const [query, setQuery] = React.useState('')
  const [division, setDivision] = React.useState('all')
  const [school, setSchool] = React.useState('all')

  if (!user) return null

  const base =
    user.role === 'supervisor'
      ? participantsForSupervisor(data, user.id)
      : user.role === 'teacher'
        ? participantsForTeacher(data, user.id)
        : data.participants

  const filtered = base.filter((participant) => {
    const student = data.users.find((item) => item.id === participant.userId)
    const matchesQuery =
      !query.trim() ||
      student?.name.toLowerCase().includes(query.toLowerCase()) ||
      participant.nis.toLowerCase().includes(query.toLowerCase()) ||
      participant.className.toLowerCase().includes(query.toLowerCase())
    const matchesDivision = division === 'all' || participant.divisionId === division
    const matchesSchool = school === 'all' || participant.schoolId === school
    return matchesQuery && matchesDivision && matchesSchool
  })

  const hadir = base.filter((participant) => {
    const today = todayAttendance(data, participant.id)
    return today?.status === 'present' || today?.status === 'late'
  }).length
  const low = lowAttendanceParticipants(data, base)
  const pendingLeaves = data.leaves.filter(
    (leave) =>
      base.some((participant) => participant.id === leave.participantId) &&
      leave.status === 'pending',
  )

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={user.role === 'teacher' ? 'Siswa bimbingan' : 'Peserta PKL'}
        title={user.role === 'teacher' ? 'Siswa bimbingan' : 'Peserta bimbingan'}
        description="Lihat profil, kehadiran, jurnal, izin, dan penilaian setiap peserta."
        actions={
          user.role === 'admin' ? (
            <Link to="/admin/users" className={buttonVariants()}>
              <UserPlus className="h-4 w-4" />
              Tambah peserta
            </Link>
          ) : (
            <Badge variant="secondary" className="h-8 px-3">
              <Users className="h-3 w-3" />
              {base.length} peserta
            </Badge>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total peserta" value={base.length} hint="dalam cakupanmu" icon={Users} tone="primary" />
        <StatCard label="Hadir hari ini" value={hadir} hint="sudah presensi QR" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Perlu perhatian" value={low.length} hint="kehadiran < 80%" icon={TriangleAlert} tone="rose" />
        <StatCard label="Izin menunggu" value={pendingLeaves.length} hint="perlu ditinjau" icon={FileText} tone="amber" />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIS, atau kelas..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={division}
            onChange={(event) => setDivision(event.target.value)}
            className="sm:w-[190px]"
          >
            <option value="all">Semua divisi</option>
            {data.divisions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            className="sm:w-[190px]"
          >
            <option value="all">Semua sekolah</option>
            {data.schools.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Peserta tidak ditemukan"
          description="Coba ubah kata kunci atau filter divisi dan sekolah."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((participant) => {
            const student = data.users.find((item) => item.id === participant.userId)
            const divisionItem = data.divisions.find(
              (item) => item.id === participant.divisionId,
            )
            const schoolItem = data.schools.find((item) => item.id === participant.schoolId)
            const supervisor = data.users.find(
              (item) => item.id === participant.supervisorId,
            )
            const summary = summarizeAttendance(participantRecords(data, participant.id))
            const today = todayAttendance(data, participant.id)
            return (
              <Card key={participant.id} className="group transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={student?.name ?? 'Peserta'} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{student?.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {participant.nis} · {participant.className}
                          </p>
                        </div>
                        {today ? (
                          <AttendanceBadge status={today.status} />
                        ) : (
                          <Badge variant="warning">Belum</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary">{divisionItem?.name}</Badge>
                        <Badge variant="outline">{schoolItem?.name}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/30 p-2.5">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Kehadiran</p>
                      <p
                        className={cn(
                          'text-sm font-extrabold',
                          summary.rate >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400',
                        )}
                      >
                        {summary.rate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Terlambat</p>
                      <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                        {summary.late}x
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="truncate text-[9px] text-muted-foreground">
                      <GraduationCap className="mr-1 inline h-3 w-3" />
                      {supervisor?.name}
                    </p>
                    <Link
                      to={`/participants/${participant.id}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                    >
                      Lihat detail
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Data kehadiran diperbarui otomatis setiap kali peserta melakukan scan QR.
            Persentase dihitung dari seluruh catatan presensi pada periode PKL aktif.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
