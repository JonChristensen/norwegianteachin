import { prisma } from "./prisma"
import { getSession } from "@auth0/nextjs-auth0"

export async function getOrCreateUser() {
  const session = await getSession()

  if (!session?.user) {
    throw new Error("Not authenticated")
  }

  const { sub, email, name } = session.user

  // Find or create the user in our database
  const user = await prisma.user.upsert({
    where: {
      authProviderId: sub,
    },
    update: {
      email: email || "",
      name: name || "",
    },
    create: {
      authProviderId: sub,
      email: email || "",
      name: name || "",
    },
  })

  return user
}

