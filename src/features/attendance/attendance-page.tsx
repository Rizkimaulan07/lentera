import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Plus,
  Printer,
  ScanLine,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { AttendanceBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  ATTENDANCE_STATUS_META,
} from '@/lib/constants'
import {
  participantsForSupervisor,
  participantsForTeacher,
} from '@/lib/analytics'
import {
  cn,
  dateKey,
  downloadCsv,
  formatDate,
  getParticipantByUserId,
  summarizeAttendance,
  todayKey,
} from '@/lib/utils'
import type { Attendance, AttendanceStatus, Participant } from '@/types'

function monthLabel(value: string) {
  try {
    return format(parse(value, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: localeId })
  } catch {
    return value
  }
}

export function AttendancePage() {
  const { user } = useAuth()
  const { data, recordManualAttendance } = useData()
  const [month, setMonth] = React.useState(format(new Date(), 'yyyy-MM'))
  const [status, setStatus] = React.useState<'all' | AttendanceStatus>('all')
  const [participantFilter, setParticipantFilter] = React.useState('all')
  const [divisionFilter, setDivisionFilter] = React.useState('all')
  const [tab, setTab] = React.useState('table')
  const [page, setPage] = React.useState(1)
  const [manualOpen, setManualOpen] = React.useState(false)
  const [manualError, setManualError] = React.useState('')
  const [manualForm, setManualForm] = React.useState({
    participantId: '',
    date: todayKey(),
    status: 'present' as AttendanceStatus,
    checkIn: '07:30',
    checkOut: '',
    note: '',
  })

  if (!user) return null

  const ownParticipant = getParticipantByUserId(data.participants, user.id)
  const baseParticipants: Participant[] =
    user.role === 'participant'
      ? ownParticipant
        ? [ownParticipant]
        : []
      : user.role === 'supervisor'
        ? participantsForSupervisor(data, user.id)
        : user.role === 'teacher'
          ? participantsForTeacher(data, user.id)
          : data.participants

  const visibleParticipants = baseParticipants.filter(
    (participant) =>
      divisionFilter === 'all' || participant.divisionId === divisionFilter,
  )
  const visibleIds = visibleParticipants.map((participant) => participant.id)

  const filtered = data.attendances
    .filter((record) => visibleIds.includes(record.participantId))
    .filter((record) => record.date.startsWith(month))
    .filter((record) => status === 'all' || record.status === status)
    .filter(
      (record) =>
        participantFilter === 'all' || record.participantId === participantFilter,
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  const summary = summarizeAttendance(filtered)
  const selectedCalendarId =
    participantFilter !== 'all'
      ? participantFilter
      : ownParticipant?.id ?? visibleParticipants[0]?.id ?? ''
  const selectedCalendarParticipant = data.participants.find(
    (participant) => participant.id === selectedCalendarId,
  )
  const calendarRecords = data.attendances.filter(
    (record) => record.participantId === selectedCalendarId && record.date.startsWith(month),
  )
  const calendarDate = parse(month, 'yyyy-MM', new Date())
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(calendarDate), { weekStartsOn: 1 }),
  })
  const pageSize = 12
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const openManual = () => {
    setManualError('')
    setManualForm({
      participantId: visibleParticipants[0]?.id ?? '',
      date: todayKey(),
      status: 'present',
      checkIn: '07:30',
      checkOut: '',
      note: '',
    })
    setManualOpen(true)
  }

  const submitManual = (event: React.FormEvent) => {
    event.preventDefault()
    if (!manualForm.participantId) {
      setManualError('Pilih peserta terlebih dahulu.')
      return
    }
    if (!manualForm.note.trim()) {
      setManualError('Alasan presensi manual wajib diisi untuk audit.')
      return
    }
    const result = recordManualAttendance({
      participantId: manualForm.participantId,
      date: manualForm.date,
      status: manualForm.status,
      checkIn: manualForm.status === 'present' || manualForm.status === 'late' ? manualForm.checkIn : undefined,
      checkOut: manualForm.checkOut || undefined,
      note: manualForm.note,
      actorId: user.id,
    })
    if (!result.ok) {
      setManualError(result.message)
      return
    }
    toast.success(result.message)
    setManualOpen(false)
  }

  const exportCsv = () => {
    const headers = [
      'Tanggal',
      'Peserta',
      'NIS',
      'Divisi',
      'Jam masuk',
      'Jam pulang',
      'Status',
      'Metode',
      'Catatan',
    ]
    const rows = filtered.map((record) => {
      const participant = data.participants.find(
        (item) => item.id === record.participantId,
      )
      const student = data.users.find((item) => item.id === participant?.userId)
      const division = data.divisions.find((item) => item.id === participant?.divisionId)
      return [
        record.date,
        student?.name ?? '-',
        participant?.nis ?? '-',
        division?.name ?? '-',
        record.checkIn ?? '-',
        record.checkOut ?? '-',
        ATTENDANCE_STATUS_META[record.status].label,
        record.method,
        record.note ?? '',
      ]
    })
    downloadCsv(`rekap-presensi-${month}.csv`, [headers, ...rows])
    toast.success('Rekap presensi berhasil diunduh.')
  }

  const columns = [
    {
      key: 'date',
      header: 'Tanggal',
      mobileOrder: 1,
      cell: (record: Attendance) => (
        <div>
          <p className="text-xs font-bold">{formatDate(record.date, 'EEE, d MMM')}</p>
          <p className="text-[10px] text-muted-foreground">{record.date}</p>
        </div>
      ),
    },
    ...(user.role === 'participant'
      ? []
      : [
          {
            key: 'participant',
            header: 'Peserta',
            mobileSpan: true,
            mobileOrder: 0,
            cell: (record: Attendance) => {
              const participant = data.participants.find(
                (item) => item.id === record.participantId,
              )
              const student = data.users.find(
                (item) => item.id === participant?.userId,
              )
              return (
                <div>
                  <p className="text-xs font-bold">{student?.name ?? '-'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {participant?.nis} · {participant?.className}
                  </p>
                </div>
              )
            },
          },
        ]),
    {
      key: 'time',
      header: 'Masuk / Pulang',
      mobileOrder: 3,
      cell: (record: Attendance) => (
        <div className="font-mono text-[11px]">
          <span className="font-bold">{record.checkIn ?? '—'}</span>
          <span className="text-muted-foreground"> / {record.checkOut ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Metode',
      mobileOrder: 4,
      cell: (record: Attendance) => (
        <Badge variant={record.method === 'qr' ? 'info' : 'secondary'}>
          {record.method === 'qr' ? 'QR' : 'Manual'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileOrder: 2,
      cell: (record: Attendance) => <AttendanceBadge status={record.status} />,
    },
    {
      key: 'note',
      header: 'Catatan',
      mobileSpan: true,
      mobileOrder: 5,
      cell: (record: Attendance) => (
        <p className="max-w-[220px] truncate text-[10px] text-muted-foreground">
          {record.note ?? '—'}
        </p>
      ),
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={user.role === 'participant' ? 'Riwayat pribadi' : 'Monitoring kehadiran'}
        title="Presensi & rekap"
        description={
          user.role === 'participant'
            ? 'Lihat riwayat presensi, kalender kehadiran, dan rekap periode.'
            : 'Pantau kehadiran peserta, filter berdasarkan periode, dan ekspor laporan.'
        }
        actions={
          user.role === 'participant' ? (
            <Link to="/scan" className={buttonVariants()}>
              <ScanLine className="h-4 w-4" />
              Scan QR
            </Link>
          ) : (
            <>
              <Button variant="outline" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                Excel/CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Cetak
              </Button>
              {user.role !== 'teacher' ? (
                <Button onClick={openManual}>
                  <Plus className="h-4 w-4" />
                  Presensi manual
                </Button>
              ) : null}
            </>
          )
        }
      />

      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-primary" />
            Filter data
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="month" className="text-[11px] text-muted-foreground">
              Bulan
            </Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value)
                setPage(1)
              }}
            />
          </div>
          {user.role !== 'participant' ? (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Peserta</Label>
              <Select
                value={participantFilter}
                onChange={(event) => {
                  setParticipantFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="all">Semua peserta</option>
                {visibleParticipants.map((participant) => {
                  const student = data.users.find(
                    (item) => item.id === participant.userId,
                  )
                  return (
                    <option key={participant.id} value={participant.id}>
                      {student?.name} · {participant.nis}
                    </option>
                  )
                })}
              </Select>
            </div>
          ) : null}
          {user.role === 'admin' ? (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Divisi</Label>
              <Select
                value={divisionFilter}
                onChange={(event) => {
                  setDivisionFilter(event.target.value)
                  setParticipantFilter('all')
                  setPage(1)
                }}
              >
                <option value="all">Semua divisi</option>
                {data.divisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Status</Label>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as 'all' | AttendanceStatus)
                setPage(1)
              }}
            >
              <option value="all">Semua status</option>
              {(Object.keys(ATTENDANCE_STATUS_META) as AttendanceStatus[]).map(
                (item) => (
                  <option key={item} value={item}>
                    {ATTENDANCE_STATUS_META[item].label}
                  </option>
                ),
              )}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Kehadiran"
          value={`${summary.rate}%`}
          hint={`${summary.present + summary.late} dari ${summary.total} catatan`}
          icon={CalendarDays}
          tone="emerald"
        />
        <StatCard label="Hadir" value={summary.present} hint="tepat waktu" icon={CalendarDays} tone="emerald" />
        <StatCard label="Terlambat" value={summary.late} hint="melewati batas" icon={CalendarDays} tone="amber" />
        <StatCard label="Izin / sakit" value={summary.leave + summary.sick} hint="disetujui" icon={CalendarDays} tone="sky" />
        <StatCard
          label="Alpa"
          value={summary.absent}
          hint="tanpa keterangan"
          icon={CalendarDays}
          tone="rose"
          className="col-span-2 md:col-span-1"
        />
      </div>

      <Card className="print-area">
        <CardHeader className="no-print flex-col items-start justify-between gap-3 sm:flex-row">
          <div>
            <CardTitle>Rekap {monthLabel(month)}</CardTitle>
            <CardDescription>
              {filtered.length} catatan presensi · {summary.rate}% kehadiran
            </CardDescription>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="table" className="flex-1 sm:flex-none">
                Tabel
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 sm:flex-none">
                Kalender
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsContent value="table">
              <DataTable
                columns={columns}
                rows={paged}
                keyFor={(record) => record.id}
                emptyTitle="Tidak ada data pada filter ini"
                emptyDescription="Coba ubah bulan, status, atau peserta yang dipilih."
              />
              {filtered.length > pageSize ? (
                <div className="no-print mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                  <p className="text-[10px] text-muted-foreground">
                    Halaman {page} dari {totalPages} · {filtered.length} catatan
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="calendar">
              {!selectedCalendarParticipant ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Pilih peserta"
                  description="Pilih peserta pada filter untuk melihat kalender kehadirannya."
                />
              ) : (
                <div>
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold">
                        {data.users.find((item) => item.id === selectedCalendarParticipant.userId)?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedCalendarParticipant.className} · {selectedCalendarParticipant.nis}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setMonth(format(subMonths(calendarDate, 1), 'yyyy-MM'))
                        }
                        aria-label="Bulan sebelumnya"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[130px] text-center text-xs font-bold">
                        {monthLabel(month)}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setMonth(format(addMonths(calendarDate, 1), 'yyyy-MM'))
                        }
                        aria-label="Bulan berikutnya"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                      <div
                        key={day}
                        className="py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day) => {
                      const key = dateKey(day)
                      const record = calendarRecords.find((item) => item.date === key)
                      const inMonth = isSameMonth(day, calendarDate)
                      const meta = record ? ATTENDANCE_STATUS_META[record.status] : null
                      return (
                        <div
                          key={key}
                          className={cn(
                            'min-h-[62px] rounded-lg border p-1.5 text-left transition-colors',
                            inMonth ? 'border-border/60' : 'border-transparent opacity-35',
                            meta ? meta.calendar : 'bg-muted/20',
                          )}
                        >
                          <p className="text-[10px] font-bold">{format(day, 'd')}</p>
                          {record ? (
                            <div className="mt-1">
                              <p className="text-[8px] font-bold">{meta?.label}</p>
                              <p className="text-[8px] opacity-80">
                                {record.checkIn ?? '—'}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-border/70 pt-3">
                    {(Object.keys(ATTENDANCE_STATUS_META) as AttendanceStatus[]).map(
                      (item) => (
                        <span
                          key={item}
                          className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                        >
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-sm border',
                              ATTENDANCE_STATUS_META[item].calendar,
                            )}
                          />
                          {ATTENDANCE_STATUS_META[item].label}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Presensi manual</DialogTitle>
            <DialogDescription>
              Gunakan untuk kasus darurat seperti HP rusak atau sinyal buruk. Tindakan ini
              tercatat di log aktivitas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitManual} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="manual-participant">Peserta</Label>
              <Select
                id="manual-participant"
                value={manualForm.participantId}
                onChange={(event) =>
                  setManualForm((form) => ({ ...form, participantId: event.target.value }))
                }
              >
                <option value="">Pilih peserta</option>
                {visibleParticipants.map((participant) => {
                  const student = data.users.find(
                    (item) => item.id === participant.userId,
                  )
                  return (
                    <option key={participant.id} value={participant.id}>
                      {student?.name} · {participant.nis}
                    </option>
                  )
                })}
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="manual-date">Tanggal</Label>
                <Input
                  id="manual-date"
                  type="date"
                  value={manualForm.date}
                  onChange={(event) =>
                    setManualForm((form) => ({ ...form, date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-status">Status</Label>
                <Select
                  id="manual-status"
                  value={manualForm.status}
                  onChange={(event) =>
                    setManualForm((form) => ({
                      ...form,
                      status: event.target.value as AttendanceStatus,
                    }))
                  }
                >
                  <option value="present">Hadir</option>
                  <option value="late">Terlambat</option>
                  <option value="absent">Alpa</option>
                  <option value="leave">Izin</option>
                  <option value="sick">Sakit</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="manual-in">Jam masuk</Label>
                <Input
                  id="manual-in"
                  type="time"
                  value={manualForm.checkIn}
                  onChange={(event) =>
                    setManualForm((form) => ({ ...form, checkIn: event.target.value }))
                  }
                  disabled={
                    manualForm.status === 'absent' ||
                    manualForm.status === 'leave' ||
                    manualForm.status === 'sick'
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-out">Jam pulang</Label>
                <Input
                  id="manual-out"
                  type="time"
                  value={manualForm.checkOut}
                  onChange={(event) =>
                    setManualForm((form) => ({ ...form, checkOut: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-note">Alasan / catatan</Label>
              <Textarea
                id="manual-note"
                placeholder="Contoh: HP peserta rusak, presensi dibantu pembimbing."
                value={manualForm.note}
                onChange={(event) =>
                  setManualForm((form) => ({ ...form, note: event.target.value }))
                }
              />
            </div>
            {manualError ? (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                {manualError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManualOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan presensi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
