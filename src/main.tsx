import App from '@/app/App'
import { CloudLoader } from '@/app/CloudLoader'
import { TenantProvider } from '@/lib/tenant/context'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import { FilePreviewProvider } from '@/app/components/file-preview/FilePreviewProvider'

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
