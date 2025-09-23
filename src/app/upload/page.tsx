import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import UploadPage from "@/components/upload/UploadPage"

export default async function Upload() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return <UploadPage />
}