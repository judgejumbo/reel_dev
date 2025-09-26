import { Suspense } from "react"
import EmailVerificationHandler from "./EmailVerificationHandler"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function EmailVerificationPage({ params }: PageProps) {
  const { token } = await params

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Suspense fallback={<div>Loading...</div>}>
          <EmailVerificationHandler token={token} />
        </Suspense>
      </div>
    </div>
  )
}