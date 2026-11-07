import { cn } from '@/lib/utils'

const baseUrl = import.meta.env.BASE_URL

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-black/10',
        className,
      )}
      aria-hidden="true"
    >
      <img src={`${baseUrl}len-mark.png`} alt="" className="h-full w-full object-contain" />
    </span>
  )
}

export function Brand({
  compact = false,
  light = false,
  className,
}: {
  compact?: boolean
  light?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-10 w-14 shadow-lg shadow-black/10" />
      {!compact ? (
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              'text-[17px] font-extrabold tracking-[0.08em]',
              light ? 'text-white' : 'text-foreground',
            )}
          >
            LENTERA
          </p>
          <p
            className={cn(
              'mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.16em]',
              light ? 'text-sidebar-muted' : 'text-muted-foreground',
            )}
          >
            Len Internship
          </p>
        </div>
      ) : null}
    </div>
  )
}
