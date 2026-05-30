import App from '@/app/App'
import { CloudLoader } from '@/app/CloudLoader'
import { TenantProvider } from '@/lib/tenant/context'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/index.css'
import { FilePreviewProvider } from '@/app/components/file-preview/FilePreviewProvider'

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info('[PWA] Aplikacja gotowa do pracy offline')
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TenantProvider>
      <CloudLoader>
        <FilePreviewProvider>
          <App />
        </FilePreviewProvider>
      </CloudLoader>
    </TenantProvider>
  </StrictMode>,
)
