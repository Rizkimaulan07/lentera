import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type DialogContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  React.useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div
          className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px] animate-fade-in"
          onClick={() => onOpenChange(false)}
        />
        <div className="relative z-10 w-full max-w-lg animate-fade-up p-0 sm:p-4">
          {children}
        </div>
      </div>
    </DialogContext.Provider>,
    document.body,
  )
}

export function DialogContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(DialogContext)
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'max-h-[calc(100svh-0.5rem)] overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl sm:max-h-[90svh] sm:rounded-2xl sm:p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => context?.onOpenChange(false)}
          aria-label="Tutup"
          className="-mr-1 -mt-1 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('space-y-1.5', className)}>{children}</div>
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <h2 className={cn('text-lg font-bold tracking-tight', className)}>{children}</h2>
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p className={cn('text-sm leading-relaxed text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export function DialogFooter({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'mt-5 flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end',
        className,
      )}
    >
      {children}
    </div>
  )
}
