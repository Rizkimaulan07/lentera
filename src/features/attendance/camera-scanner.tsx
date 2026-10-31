import * as React from 'react'
import { Camera, CameraOff, Loader2, RefreshCw, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error'

interface ScannerInstance {
  stop: () => Promise<void>
  clear: () => void
}

export function CameraScanner({
  onDetected,
  className,
}: {
  onDetected: (text: string) => void
  className?: string
}) {
  const elementId = `lentera-qr-${React.useId().replace(/[:]/g, '')}`
  const [status, setStatus] = React.useState<ScannerStatus>('idle')
  const [error, setError] = React.useState('')
  const scannerRef = React.useRef<ScannerInstance | null>(null)
  const mountedRef = React.useRef(true)
  const detectedRef = React.useRef(false)

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const scanner = scannerRef.current
      scannerRef.current = null
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined)
      }
    }
  }, [])

  const stop = React.useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner) {
      try {
        await scanner.stop()
        scanner.clear()
      } catch {
        // Kamera mungkin sudah berhenti.
      }
    }
    if (mountedRef.current) setStatus('idle')
  }, [])

  const start = async () => {
    setError('')
    setStatus('starting')
    detectedRef.current = false
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      if (!mountedRef.current) return
      const scanner = new Html5Qrcode(elementId)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (detectedRef.current) return
          detectedRef.current = true
          void stop()
          onDetected(decodedText)
        },
        () => undefined,
      )
      if (mountedRef.current) setStatus('scanning')
    } catch (err) {
      if (!mountedRef.current) return
      const message =
        err instanceof Error ? err.message : 'Kamera tidak dapat diakses.'
      setError(
        /permission|notallowed|denied/i.test(message)
          ? 'Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser, lalu coba lagi.'
          : /secure|https/i.test(message)
            ? 'Kamera hanya bisa dibuka melalui HTTPS atau localhost.'
            : 'Kamera tidak dapat dibuka. Pastikan tidak sedang dipakai aplikasi lain, lalu coba lagi.',
      )
      setStatus('error')
      scannerRef.current = null
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        id={elementId}
        className={cn(
          'relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-slate-950/[0.03] dark:bg-white/[0.02]',
          status === 'scanning' && 'border-solid border-primary/40',
        )}
      >
        {status === 'scanning' ? (
          <>
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2">
                <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-4 border-t-4 border-accent" />
                <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-4 border-t-4 border-accent" />
                <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-4 border-l-4 border-accent" />
                <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-4 border-r-4 border-accent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-center text-[11px] font-semibold text-white">
                Arahkan kamera ke QR di layar pembimbing
              </div>
            </div>
          </>
        ) : status === 'starting' ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold">Menyiapkan kamera...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              {status === 'error' ? <CameraOff className="h-7 w-7" /> : <Camera className="h-7 w-7" />}
            </span>
            <p className="mt-4 text-sm font-bold">
              {status === 'error' ? 'Kamera belum bisa dibuka' : 'Pindai QR presensi'}
            </p>
            <p className="mt-1.5 max-w-[230px] text-[11px] leading-relaxed text-muted-foreground">
              {status === 'error'
                ? error
                : 'Izinkan akses kamera, lalu arahkan ke QR yang ditampilkan pembimbing.'}
            </p>
            <Button className="mt-4" size="sm" onClick={start}>
              {status === 'error' ? <RefreshCw className="h-3.5 w-3.5" /> : <ScanLine className="h-3.5 w-3.5" />}
              {status === 'error' ? 'Coba lagi' : 'Aktifkan kamera'}
            </Button>
          </div>
        )}
      </div>

      {status === 'scanning' ? (
        <Button variant="outline" size="sm" className="w-full" onClick={stop}>
          <CameraOff className="h-3.5 w-3.5" />
          Hentikan kamera
        </Button>
      ) : null}

      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        Kamera hanya aktif saat kamu menekan tombol. Gambar tidak disimpan.
      </p>
    </div>
  )
}
