import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/providers/auth-provider'
import { DataProvider } from '@/providers/data-provider'
import { ThemeProvider, useTheme } from '@/providers/theme-provider'

function AppToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans',
        },
      }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <App />
          <AppToaster />
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  </StrictMode>,
)
