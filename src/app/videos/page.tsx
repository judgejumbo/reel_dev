import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import VideoLibrary from "@/components/videos/VideoLibrary"

export default async function VideosPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return <VideoLibrary />
}