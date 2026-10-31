import * as React from 'react'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Save,
  School,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  ACTIVITY_TYPE_LABELS,
  DAY_SHORT,
} from '@/lib/constants'
import { cn, formatDate, uid } from '@/lib/utils'
import type { Activity, ActivityType, AssessmentComponent } from '@/types'

function emptyActivity(): Activity {
  return {
    id: uid('act'),
    name: '',
    type: 'dhuha',
    days: [1, 2, 3, 4, 5],
    startTime: '07:00',
    endTime: '07:20',
    active: true,
    mandatory: true,
  }
}

export function AdminMasterPage() {
  const { user } = useAuth()
  const {
    data,
    addSchool,
    addDivision,
    addPeriod,
    activatePeriod,
    saveComponents,
    saveActivity,
  } = useData()
  const [tab, setTab] = React.useState('schools')
  const [schoolForm, setSchoolForm] = React.useState({ name: '', address: '' })
  const [divisionForm, setDivisionForm] = React.useState({ name: '', description: '' })
  const [periodForm, setPeriodForm] = React.useState({
    name: '',
    startDate: '',
    endDate: '',
  })
  const [componentDraft, setComponentDraft] = React.useState<AssessmentComponent[]>(
    data.assessmentComponents,
  )
  const [activityOpen, setActivityOpen] = React.useState(false)
  const [activityForm, setActivityForm] = React.useState<Activity>(emptyActivity)

  React.useEffect(() => {
    setComponentDraft(data.assessmentComponents)
  }, [data.assessmentComponents])

  if (!user) return null

  const totalWeight = componentDraft.reduce(
    (sum, component) => sum + Number(component.weight || 0),
    0,
  )

  const handleSchool = (event: React.FormEvent) => {
    event.preventDefault()
    if (!schoolForm.name.trim()) return
    addSchool(schoolForm.name.trim(), schoolForm.address.trim(), user.id)
    toast.success('Sekolah berhasil ditambahkan.')
    setSchoolForm({ name: '', address: '' })
  }

  const handleDivision = (event: React.FormEvent) => {
    event.preventDefault()
    if (!divisionForm.name.trim()) return
    addDivision(divisionForm.name.trim(), divisionForm.description.trim(), user.id)
    toast.success('Divisi berhasil ditambahkan.')
    setDivisionForm({ name: '', description: '' })
  }

  const handlePeriod = (event: React.FormEvent) => {
    event.preventDefault()
    if (!periodForm.name.trim() || !periodForm.startDate || !periodForm.endDate) {
      toast.error('Nama, tanggal mulai, dan tanggal selesai wajib diisi.')
      return
    }
    if (periodForm.startDate > periodForm.endDate) {
      toast.error('Tanggal selesai harus setelah tanggal mulai.')
      return
    }
    addPeriod(
      periodForm.name.trim(),
      periodForm.startDate,
      periodForm.endDate,
      user.id,
    )
    toast.success('Periode PKL berhasil ditambahkan.')
    setPeriodForm({ name: '', startDate: '', endDate: '' })
  }

  const updateComponent = (
    id: string,
    patch: Partial<AssessmentComponent>,
  ) => {
    setComponentDraft((current) =>
      current.map((component) =>
        component.id === id ? { ...component, ...patch } : component,
      ),
    )
  }

  const handleSaveComponents = () => {
    const result = saveComponents(componentDraft, user.id)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(result.message)
  }

  const openActivity = (activity?: Activity) => {
    setActivityForm(activity ? { ...activity } : emptyActivity())
    setActivityOpen(true)
  }

  const handleSaveActivity = (event: React.FormEvent) => {
    event.preventDefault()
    if (!activityForm.name.trim()) {
      toast.error('Nama kegiatan wajib diisi.')
      return
    }
    if (!activityForm.days.length) {
      toast.error('Pilih minimal satu hari pelaksanaan.')
      return
    }
    saveActivity(
      {
        ...activityForm,
        name: activityForm.name.trim(),
      },
      user.id,
    )
    toast.success('Kegiatan berhasil disimpan.')
    setActivityOpen(false)
  }

  const toggleDay = (day: number) => {
    setActivityForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day].sort(),
    }))
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Master data PKL"
        description="Kelola sekolah, divisi, periode, komponen penilaian, dan kegiatan rutin peserta."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Sekolah mitra"
          value={data.schools.length}
          hint="sekolah terdaftar"
          icon={School}
          tone="primary"
        />
        <StatCard
          label="Divisi penempatan"
          value={data.divisions.length}
          hint="unit di PT Len"
          icon={Building2}
          tone="sky"
        />
        <StatCard
          label="Periode PKL"
          value={data.periods.length}
          hint={`${data.periods.filter((item) => item.active).length} periode aktif`}
          icon={CalendarDays}
          tone="violet"
        />
        <StatCard
          label="Komponen nilai"
          value={data.assessmentComponents.length}
          hint={`total bobot ${data.assessmentComponents.reduce((sum, item) => sum + item.weight, 0)}%`}
          icon={GraduationCap}
          tone="emerald"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="schools">
            <School className="h-3.5 w-3.5" />
            Sekolah
          </TabsTrigger>
          <TabsTrigger value="divisions">
            <Building2 className="h-3.5 w-3.5" />
            Divisi
          </TabsTrigger>
          <TabsTrigger value="periods">
            <CalendarDays className="h-3.5 w-3.5" />
            Periode
          </TabsTrigger>
          <TabsTrigger value="components">
            <Layers className="h-3.5 w-3.5" />
            Komponen nilai
          </TabsTrigger>
          <TabsTrigger value="activities">
            <Dumbbell className="h-3.5 w-3.5" />
            Kegiatan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schools">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Tambah sekolah</CardTitle>
                <CardDescription>Daftarkan sekolah mitra PKL.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSchool} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="school-name">Nama sekolah</Label>
                    <Input
                      id="school-name"
                      placeholder="SMKN 1 Bandung"
                      value={schoolForm.name}
                      onChange={(event) =>
                        setSchoolForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="school-address">Alamat</Label>
                    <Textarea
                      id="school-address"
                      rows={3}
                      placeholder="Jl. ..."
                      value={schoolForm.address}
                      onChange={(event) =>
                        setSchoolForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" />
                    Tambah sekolah
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daftar sekolah</CardTitle>
                <CardDescription>{data.schools.length} sekolah terdaftar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {data.schools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-start gap-3 rounded-xl border border-border/70 p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <School className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold">{school.name}</p>
                      <p className="text-[10px] text-muted-foreground">{school.address || 'Alamat belum diisi'}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {data.participants.filter((item) => item.schoolId === school.id).length} peserta
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="divisions">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Tambah divisi</CardTitle>
                <CardDescription>Unit kerja tempat peserta ditempatkan.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDivision} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="division-name">Nama divisi</Label>
                    <Input
                      id="division-name"
                      placeholder="Digital & Teknologi"
                      value={divisionForm.name}
                      onChange={(event) =>
                        setDivisionForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="division-description">Deskripsi</Label>
                    <Textarea
                      id="division-description"
                      rows={3}
                      placeholder="Deskripsi singkat divisi..."
                      value={divisionForm.description}
                      onChange={(event) =>
                        setDivisionForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" />
                    Tambah divisi
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daftar divisi</CardTitle>
                <CardDescription>{data.divisions.length} divisi terdaftar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {data.divisions.map((division) => (
                  <div
                    key={division.id}
                    className="flex items-start gap-3 rounded-xl border border-border/70 p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold">{division.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {division.description || 'Deskripsi belum diisi'}
                      </p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {data.participants.filter((item) => item.divisionId === division.id).length} peserta
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="periods">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Tambah periode</CardTitle>
                <CardDescription>Periode pelaksanaan PKL.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePeriod} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="period-name">Nama periode</Label>
                    <Input
                      id="period-name"
                      placeholder="PKL Semester Ganjil 2026/2027"
                      value={periodForm.name}
                      onChange={(event) =>
                        setPeriodForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="period-start">Mulai</Label>
                      <Input
                        id="period-start"
                        type="date"
                        value={periodForm.startDate}
                        onChange={(event) =>
                          setPeriodForm((current) => ({
                            ...current,
                            startDate: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="period-end">Selesai</Label>
                      <Input
                        id="period-end"
                        type="date"
                        value={periodForm.endDate}
                        onChange={(event) =>
                          setPeriodForm((current) => ({
                            ...current,
                            endDate: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" />
                    Tambah periode
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daftar periode</CardTitle>
                <CardDescription>Satu periode dapat aktif pada satu waktu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {data.periods.map((period) => (
                  <div
                    key={period.id}
                    className={cn(
                      'rounded-xl border p-3',
                      period.active
                        ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
                        : 'border-border/70',
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold">{period.name}</p>
                          {period.active ? (
                            <Badge variant="success">
                              <CheckCircle2 className="h-3 w-3" />
                              Aktif
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatDate(period.startDate, 'd MMM yyyy')} –{' '}
                          {formatDate(period.endDate, 'd MMM yyyy')}
                        </p>
                        <p className="mt-1 text-[9px] text-muted-foreground">
                          {data.participants.filter((item) => item.periodId === period.id).length} peserta
                        </p>
                      </div>
                      {!period.active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            activatePeriod(period.id, user.id)
                            toast.success('Periode aktif diperbarui.')
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aktifkan
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components">
          <Card>
            <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
              <div>
                <CardTitle>Komponen & bobot penilaian</CardTitle>
                <CardDescription>
                  Total bobot harus 100%. Komponen disiplin dihitung otomatis dari presensi.
                </CardDescription>
              </div>
              <Badge variant={Math.round(totalWeight) === 100 ? 'success' : 'danger'}>
                Total {Math.round(totalWeight)}%
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {componentDraft.map((component, index) => (
                <div
                  key={component.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center',
                    component.auto === 'attendance'
                      ? 'border-sky-500/20 bg-sky-500/[0.04]'
                      : 'border-border/70',
                  )}
                >
                  <div className="flex items-center gap-2 sm:w-8">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`component-${component.id}`} className="sr-only">
                      Nama komponen
                    </Label>
                    <Input
                      id={`component-${component.id}`}
                      value={component.name}
                      onChange={(event) =>
                        updateComponent(component.id, { name: event.target.value })
                      }
                    />
                    {component.auto === 'attendance' ? (
                      <Badge variant="info">Otomatis dari presensi</Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Label htmlFor={`weight-${component.id}`} className="sr-only">
                        Bobot
                      </Label>
                      <Input
                        id={`weight-${component.id}`}
                        type="number"
                        min={0}
                        max={100}
                        value={component.weight}
                        onChange={(event) =>
                          updateComponent(component.id, {
                            weight: Math.max(0, Math.min(100, Number(event.target.value))),
                          })
                        }
                        className="text-center font-bold"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground">%</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                      onClick={() =>
                        setComponentDraft((current) =>
                          current.filter((item) => item.id !== component.id),
                        )
                      }
                      disabled={component.auto === 'attendance'}
                      aria-label="Hapus komponen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setComponentDraft((current) => [
                      ...current,
                      {
                        id: uid('c'),
                        name: 'Komponen baru',
                        weight: 0,
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Tambah komponen
                </Button>
                <Button onClick={handleSaveComponents}>
                  <Save className="h-4 w-4" />
                  Simpan komponen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
              <div>
                <CardTitle>Kegiatan rutin</CardTitle>
                <CardDescription>
                  Olahraga dan Dhuha yang wajib diikuti peserta sesuai jadwal.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => openActivity()}>
                <Plus className="h-3.5 w-3.5" />
                Tambah kegiatan
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {activity.type === 'sports' ? (
                        <Dumbbell className="h-5 w-5" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold">{activity.name}</p>
                        <Badge variant="secondary">
                          {ACTIVITY_TYPE_LABELS[activity.type]}
                        </Badge>
                        {activity.mandatory ? <Badge variant="warning">Wajib</Badge> : null}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {activity.days.map((day) => DAY_SHORT[day]).join(', ')} ·{' '}
                        {activity.startTime}–{activity.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-border/70 px-2.5 py-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {activity.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <Switch
                        checked={activity.active}
                        onCheckedChange={(checked) => {
                          saveActivity({ ...activity, active: checked }, user.id)
                          toast.success(
                            checked ? 'Kegiatan diaktifkan.' : 'Kegiatan dinonaktifkan.',
                          )
                        }}
                        label={`Status ${activity.name}`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openActivity(activity)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {data.activities.some((item) => item.id === activityForm.id)
                ? 'Edit kegiatan'
                : 'Tambah kegiatan'}
            </DialogTitle>
            <DialogDescription>
              Atur jadwal kegiatan rutin yang diikuti peserta.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveActivity} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="activity-name">Nama kegiatan</Label>
              <Input
                id="activity-name"
                placeholder="Olahraga Pagi"
                value={activityForm.name}
                onChange={(event) =>
                  setActivityForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-type">Jenis kegiatan</Label>
              <Select
                id="activity-type"
                value={activityForm.type}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    type: event.target.value as ActivityType,
                  }))
                }
              >
                <option value="dhuha">Dhuha</option>
                <option value="sports">Olahraga</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hari pelaksanaan</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_SHORT.map((label, index) => {
                  const active = activityForm.days.includes(index)
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={cn(
                        'h-9 min-w-11 rounded-lg border px-2 text-[11px] font-bold transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="activity-start">Mulai</Label>
                <Input
                  id="activity-start"
                  type="time"
                  value={activityForm.startTime}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activity-end">Selesai</Label>
                <Input
                  id="activity-end"
                  type="time"
                  value={activityForm.endTime}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-border/70 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">Kegiatan aktif</p>
                  <p className="text-[10px] text-muted-foreground">
                    Tampil pada jadwal dan dapat dipindai QR-nya.
                  </p>
                </div>
                <Switch
                  checked={activityForm.active}
                  onCheckedChange={(checked) =>
                    setActivityForm((current) => ({ ...current, active: checked }))
                  }
                  label="Kegiatan aktif"
                />
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-2">
                <div>
                  <p className="text-xs font-semibold">Wajib diikuti</p>
                  <p className="text-[10px] text-muted-foreground">
                    Kehadiran menjadi bagian penilaian kedisiplinan.
                  </p>
                </div>
                <Switch
                  checked={activityForm.mandatory}
                  onCheckedChange={(checked) =>
                    setActivityForm((current) => ({ ...current, mandatory: checked }))
                  }
                  label="Wajib diikuti"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivityOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4" />
                Simpan kegiatan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
