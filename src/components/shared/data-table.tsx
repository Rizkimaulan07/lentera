import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataColumn<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
  /** Label shown above the value in the mobile card layout. */
  mobileLabel?: string
  /** Hide this column in the mobile card layout. */
  mobileHidden?: boolean
  /** Let this column use the full width of the mobile card. */
  mobileSpan?: boolean
  /** Reorder this column in the mobile card layout. */
  mobileOrder?: number
  /** Extra classes for this column in the mobile card layout. */
  mobileClassName?: string
}

export function DataTable<T>({
  columns,
  rows,
  keyFor,
  emptyTitle = 'Belum ada data',
  emptyDescription,
  onRowClick,
}: {
  columns: DataColumn<T>[]
  rows: T[]
  keyFor: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
}) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
        className="border-0 bg-transparent py-10"
      />
    )
  }

  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={keyFor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <div
            key={keyFor(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              'rounded-xl border border-border/70 bg-muted/20 p-3.5',
              onRowClick && 'cursor-pointer transition-colors active:bg-muted/40',
            )}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {columns
                .filter((column) => !column.mobileHidden)
                .map((column) => {
                  const label =
                    column.mobileLabel ??
                    (typeof column.header === 'string' ? column.header : null)
                  return (
                    <div
                      key={column.key}
                      style={
                        column.mobileOrder !== undefined
                          ? { order: column.mobileOrder }
                          : undefined
                      }
                      className={cn(
                        'min-w-0',
                        column.mobileSpan && 'col-span-2',
                        column.mobileClassName,
                      )}
                    >
                      {label ? (
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {label}
                        </p>
                      ) : null}
                      <div className="min-w-0 text-xs">{column.cell(row)}</div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
