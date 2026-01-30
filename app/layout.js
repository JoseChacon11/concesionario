import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata = {
  title: 'El mejor Concesionario',
  description: 'Explora las mejores marcas en un solo lugar. Fichas técnicas interactivas, galería en alta resolución y atención directa por WhatsApp. Tu próxima aventura comienza aquí.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
