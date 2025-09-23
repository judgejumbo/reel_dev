import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reel Dev</CardTitle>
          <CardDescription>
            Video repurposing SaaS - Convert horizontal videos to vertical format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <a href="/register">Get Started</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href="/login">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
