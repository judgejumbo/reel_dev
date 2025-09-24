"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Upload, User, Settings, LogOut, Crown } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

export function Navigation() {
  const { data: session } = useSession()
  const isAuthenticated = !!session
  const user = session?.user

  // Generate user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-2xl font-black text-emerald-800">ReelDev</span>
          </Link>
        </div>

        {/* Mobile Logo */}
        <div className="mr-2 flex md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-black text-emerald-800">ReelDev</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1">
          {!isAuthenticated ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/#features" className="group inline-flex h-10 w-max items-center justify-center rounded-lg border-2 border-emerald-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100/70 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400">
                      Features
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/#pricing" className="group inline-flex h-10 w-max items-center justify-center rounded-lg border-2 border-emerald-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100/70 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400">
                      Pricing
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/#resources" className="group inline-flex h-10 w-max items-center justify-center rounded-lg border-2 border-emerald-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100/70 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400">
                      Resources
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/dashboard" className="group inline-flex h-10 w-max items-center justify-center rounded-lg border-2 border-emerald-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100/70 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400">
                      Dashboard
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/upload" className="group inline-flex h-10 w-max items-center justify-center rounded-lg border-2 border-emerald-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100/70 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400">
                      My Videos
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* CTA Button */}
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 sm:px-6">
            <Link href={isAuthenticated ? "/upload" : "/register"}>
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                {isAuthenticated ? "Upload Video" : "Start Free"}
              </span>
              <span className="sm:hidden">
                {isAuthenticated ? "Upload" : "Start Free"}
              </span>
            </Link>
          </Button>

          {/* Auth Actions */}
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" asChild className="text-emerald-700 hover:text-emerald-800 hidden sm:flex">
                <Link href="/login">Log In</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-medium">
                      {user?.name ? getUserInitials(user.name) : <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="pb-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-slate-900">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Crown className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Free Plan</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pl-1 pr-0">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Link href="/" className="flex items-center">
                    <span className="text-xl font-black text-emerald-800">ReelDev</span>
                  </Link>
                </SheetTitle>
                <SheetDescription>
                  Mobile menu
                </SheetDescription>
              </SheetHeader>
              <div className="my-4 h-px bg-border" />
              <div className="flex flex-col space-y-2">
                {/* Mobile CTA */}
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold justify-start">
                  <Link href={isAuthenticated ? "/upload" : "/register"}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isAuthenticated ? "Upload Video" : "Start Free"}
                  </Link>
                </Button>

                <div className="my-2 h-px bg-border" />

                {!isAuthenticated ? (
                  <>
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/#features">Features</Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/#pricing">Pricing</Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/#resources">Resources</Link>
                    </Button>
                    <div className="my-2 h-px bg-border" />
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/upload">My Videos</Link>
                    </Button>
                    <div className="my-2 h-px bg-border" />
                    <Button variant="ghost" asChild className="justify-start text-slate-600 hover:text-emerald-700">
                      <Link href="/settings">Settings</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-red-600 hover:text-red-700"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}