import { Dumbbell, Sparkles, Utensils } from 'lucide-react'
import type { ActivityType } from '@/types'

export function ActivityIcon({
  type,
  className,
}: {
  type: ActivityType
  className?: string
}) {
  if (type === 'sports') return <Dumbbell className={className} />
  if (type === 'meal') return <Utensils className={className} />
  return <Sparkles className={className} />
}
