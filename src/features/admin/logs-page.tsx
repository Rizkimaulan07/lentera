import * as React from 'react'
import {
  Activity,
  Clock3,
  Download,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DataTable } from '@/components/shared/data-table'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  dateKey,
  downloadCsv,
  formatDateTime,
  roleLabels,
  timeAgo,
  todayKey,
} from '@/lib/utils'
import type { ActivityLog } from '@/types'

export function AdminLogsPage() {
  const { user } = useAuth()
  const { data } = useData()
  const [query, setQuery] = React.useState('')
  const [userFilter, setUserFilter] = React.useState('all')

  if (!user) return null

  const sorted = [...data.logs].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
  const filtered = sorted.filter((log) => {
    const actor = data.users.find((item) => item.id === log.userId)
    const matchesQuery =
      !query.trim() ||
      log.action.toLowerCase().includes(query.toLowerCase()) ||
      log.object.toLowerCase().includes(query.toLowerCase()) ||
      log.detail.toLowerCase().includes(query.toLowerCase()) ||
      actor?.name.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (userFilter === 'all' || log.userId === userFilter)
  })
  const today = sorted.filter((log) => dateKey(log.at) === todayKey())
  const uniqueActors = new Set(sorted.map((log) => log.userId)).size

  const exportCsv = () => {
    downloadCsv(`log-aktivitas-${todayKey()}.csv`, [
      ['Waktu', 'Pengguna', 'Peran', 'Aksi', 'Objek', 'Detail'],
      ...filtered.map((log) => {
        const actor = data.users.find((item) => item.id === log.userId)
        return [
          formatDateTime(log.at),
          actor?.name ?? 'Pengguna',
          actor ? roleLabels[actor.role] : '',
          log.action,
          log.object,
          log.detail,
        ]
      }),
    ])
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Log aktivitas"
        description="Jejak audit seluruh tindakan penting yang dilakukan pengguna di LENTERA."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4" />
            Ekspor CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total aktivitas"
          value={data.logs.length}
          hint="tercatat di sistem"
          icon={ScrollText}
          tone="primary"
        />
        <StatCard
          label="Aktivitas hari ini"
          value={today.length}
          hint="sejak 00.00 WIB"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Pengguna aktif"
          value={uniqueActors}
          hint="pernah melakukan aksi"
          icon={Users}
          tone="emerald"
        />
        <StatCard
          label="Jenis aksi"
          value={new Set(sorted.map((log) => log.action)).size}
          hint="kategori berbeda"
          icon={Activity}
          tone="sky"
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari aksi, objek, detail, atau nama pengguna..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            className="sm:w-[230px]"
          >
            <option value="all">Semua pengguna</option>
            {data.users.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat aktivitas</CardTitle>
          <CardDescription>
            {filtered.length} dari {data.logs.length} aktivitas ditampilkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<ActivityLog>
            columns={[
              {
                key: 'time',
                header: 'Waktu',
                mobileOrder: 1,
                cell: (log) => (
                  <div>
                    <p className="text-[11px] font-bold">{formatDateTime(log.at)}</p>
                    <p className="text-[9px] text-muted-foreground">{timeAgo(log.at)}</p>
                  </div>
                ),
              },
              {
                key: 'user',
                header: 'Pengguna',
                mobileSpan: true,
                mobileOrder: 0,
                cell: (log) => {
                  const actor = data.users.find((item) => item.id === log.userId)
                  return (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={actor?.name ?? 'Pengguna'} size="xs" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">
                          {actor?.name ?? 'Pengguna'}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {actor ? roleLabels[actor.role] : '—'}
                        </p>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'action',
                header: 'Aksi',
                mobileOrder: 2,
                cell: (log) => (
                  <Badge variant="secondary" className="whitespace-normal text-left">
                    {log.action}
                  </Badge>
                ),
              },
              {
                key: 'object',
                header: 'Objek',
                mobileOrder: 3,
                cell: (log) => (
                  <span className="text-[11px] font-semibold">{log.object}</span>
                ),
              },
              {
                key: 'detail',
                header: 'Detail',
                mobileSpan: true,
                mobileOrder: 4,
                cell: (log) => (
                  <span className="line-clamp-2 max-w-[320px] text-[10px] leading-relaxed text-muted-foreground">
                    {log.detail}
                  </span>
                ),
              },
            ]}
            rows={filtered}
            keyFor={(log) => log.id}
            emptyTitle="Belum ada aktivitas"
            emptyDescription="Aktivitas pengguna akan tercatat otomatis di sini."
          />
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Log aktivitas bersifat append-only pada alur normal dan membantu audit
            perubahan presensi, izin, jurnal, penilaian, serta data master. Pada versi
            produksi, log akan disimpan di backend dengan retensi sesuai kebijakan
            perusahaan.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
