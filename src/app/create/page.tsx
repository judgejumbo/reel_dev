import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import CreateProject from "@/components/create/CreateProject"

export default async function CreatePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // For now, we'll use the existing upload workflow
  // In the future, this will be a new project creation flow
  return <CreateProject userId={session.user.id} />
}