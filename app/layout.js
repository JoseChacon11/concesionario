import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'MotoDealer SaaS - Sistema Multi-tenant',
  description: 'Sistema de gestión para concesionarios de motos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}