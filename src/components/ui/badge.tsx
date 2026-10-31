import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-primary/15 bg-primary/10 text-primary',
        secondary: 'border-border bg-muted text-muted-foreground',
        success:
          'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        warning:
          'border-amber-500/25 bg-amber-500/14 text-amber-700 dark:text-amber-300',
        danger: 'border-rose-500/20 bg-rose-500/12 text-rose-700 dark:text-rose-300',
        info: 'border-sky-500/20 bg-sky-500/12 text-sky-700 dark:text-sky-300',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
