import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Rufus Trendspotter",
  description: "Inteligencia cultural en tiempo real para Rufus Social",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
