import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

const tones = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/14 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  rose: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  trend,
  className,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: keyof typeof tones
  trend?: { value: string; direction: 'up' | 'down'; positive?: boolean }
  className?: string
}) {
  return (
    <Card className={cn('group overflow-hidden p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-snug text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight sm:mt-2 sm:text-2xl xl:text-[28px]">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10 sm:rounded-xl',
            tones[tone],
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              trend.positive === false
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            )}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        ) : null}
        {hint ? (
          <p className="min-w-0 truncate text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </Card>
  )
}
