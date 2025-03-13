// No "use client" directive - this is a server component

import { Layout } from "@/components/layout"
import { HomeContent } from "@/components/home-content"

export default function HomePage() {
  return (
    <Layout>
      <HomeContent />
    </Layout>
  )
}

