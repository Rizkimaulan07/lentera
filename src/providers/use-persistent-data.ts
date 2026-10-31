import * as React from 'react'
import { createSeedData } from '@/lib/seed'
import type { AppData } from '@/types'

const DATA_KEY = 'lentera.data.v1'

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      if (parsed.users && parsed.settings && parsed.participants) return parsed
    }
  } catch {
    // Data rusak: jatuh kembali ke seed.
  }
  return createSeedData()
}

export function usePersistentData() {
  const [data, setData] = React.useState<AppData>(loadData)

  React.useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
    } catch {
      // Storage penuh: aplikasi tetap berjalan di memori.
    }
  }, [data])

  const reset = React.useCallback(() => {
    const seed = createSeedData()
    setData(seed)
    localStorage.setItem(DATA_KEY, JSON.stringify(seed))
  }, [])

  return { data, setData, reset }
}
