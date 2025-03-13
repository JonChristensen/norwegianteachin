import "@/globals.css"
import { Providers } from "@/components/providers"

export const metadata = {
  title: "Norwegian TeachIn",
  description: "Learn Norwegian interactively",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
