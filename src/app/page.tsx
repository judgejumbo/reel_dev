import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      {/* Hero Section - Discord Style */}
      <section className="pt-8 pb-12 px-4 sm:pt-16 sm:pb-20 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                  Video content that's all
                  <span className="text-emerald-600"> profit & success</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                  ReelDev transforms your horizontal videos into viral vertical content.
                  AI-powered processing meets human creative oversight for guaranteed results that drive sales and engagement.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg" asChild>
                  <a href="/upload">Start Converting Free</a>
                </Button>
                <Button size="lg" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg" asChild>
                  <a href="#demo">Watch Success Stories</a>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span>Results in 24 hours</span>
                </div>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-gradient-to-br from-emerald-100 to-amber-100 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="aspect-video bg-white rounded-lg shadow-lg flex items-center justify-center">
                  <span className="text-5xl sm:text-6xl">🎬</span>
                </div>
                <div className="mt-4 sm:mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Conversion Rate</span>
                    <span className="text-sm font-bold text-green-600">+340%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '87%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Discord Style */}
      <section className="py-12 px-4 sm:py-16 sm:px-6 lg:py-20 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4 sm:mb-6 uppercase tracking-tight">
              Make your content more profitable
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Transform boring horizontal videos into viral vertical content that drives real business results.
              Our AI-powered platform delivers the professional quality that converts viewers into customers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 sm:mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-center h-48 sm:h-64 bg-white rounded-2xl shadow-inner">
                  <span className="text-5xl sm:text-7xl">💰</span>
                </div>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                stream revenue like you're printing money
              </h3>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Our hybrid AI-human workflow doesn't just convert videos – it optimizes them for maximum engagement and sales.
                See average revenue increases of 340% when you transform your content with professional oversight and
                platform-specific optimization.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex-1">
                  <div className="text-xl sm:text-2xl font-bold text-green-700">11.4hrs</div>
                  <div className="text-sm text-green-600">Saved per week</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 flex-1">
                  <div className="text-xl sm:text-2xl font-bold text-amber-700">340%</div>
                  <div className="text-sm text-amber-600">Revenue increase</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 sm:mb-20">
            <div className="space-y-4 sm:space-y-6 lg:order-2">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                Turn views into sales, no guesswork needed
              </h3>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Stop wasting time with automated tools that miss the mark. Our human creative directors ensure
                every video captures your brand voice and drives action. From story structure to emotional beats,
                we optimize for conversions, not just views.
              </p>
            </div>
            <div className="lg:order-1">
              <div className="bg-gradient-to-br from-amber-100 to-orange-200 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-center h-48 sm:h-64 bg-white rounded-2xl shadow-inner">
                  <span className="text-5xl sm:text-7xl">🎯</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-blue-100 to-purple-200 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-center h-48 sm:h-64 bg-white rounded-2xl shadow-inner">
                  <span className="text-5xl sm:text-7xl">⚡</span>
                </div>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                Scale your success across every platform
              </h3>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                One upload, infinite possibilities. Whether it's TikTok, YouTube Shorts, Instagram Reels, or LinkedIn Video,
                we optimize your content for each platform's algorithm and audience behavior. Maximum reach, maximum revenue.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1 text-xs sm:text-sm">TikTok Ready</Badge>
                <Badge className="bg-red-100 text-red-800 border-red-300 px-3 py-1 text-xs sm:text-sm">YouTube Shorts</Badge>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 px-3 py-1 text-xs sm:text-sm">Instagram Reels</Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1 text-xs sm:text-sm">LinkedIn Video</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8">
            Trusted by content creators across industries
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <span className="text-base sm:text-lg font-semibold">YouTubers</span>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Long-form to Shorts</p>
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <span className="text-base sm:text-lg font-semibold">Marketers</span>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Campaign content</p>
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <span className="text-base sm:text-lg font-semibold">Podcasters</span>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Audio to video clips</p>
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <span className="text-base sm:text-lg font-semibold">Educators</span>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Course highlights</p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* FAQ Section */}
      <section className="py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-base sm:text-lg">How is this different from automated tools?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                Unlike $20-100 automated solutions, we combine AI efficiency with human creative oversight.
                Your videos get professional story structure, brand voice, and emotional beats that
                automated tools miss.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-base sm:text-lg">Why not hire a premium agency?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                Premium agencies cost $1000+ with slow turnaround times. We deliver agency-quality
                results without the overhead and delays, perfect for mid-market companies
                ($50M-$1B revenue) seeking professional quality with startup-friendly pricing.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-base sm:text-lg">What formats do you support?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                We specialize in converting horizontal videos to 1080x1920 vertical format,
                perfect for TikTok, YouTube Shorts, Instagram Reels, and LinkedIn video content.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-base sm:text-lg">How does the human-in-the-loop workflow work?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                AI handles technical tasks (rough cuts, transcription, scene detection, audio syncing)
                while human editors focus on creative decisions. This hybrid approach saves 11.4 hours
                per week per editor while maintaining professional quality.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section - Discord Style */}
      <section className="py-12 px-4 sm:py-16 sm:px-6 lg:py-20 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black leading-tight uppercase">
                  You can't scroll anymore.
                  <br />
                  <span className="text-amber-300">Better start profiting.</span>
                </h2>
                <p className="text-lg sm:text-xl text-green-100 leading-relaxed">
                  Stop leaving money on the table. Transform your content library into a revenue-generating machine.
                  Join 10,000+ creators who've already boosted their income with ReelDev.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold shadow-2xl" asChild>
                  <a href="/upload">Start Converting Free</a>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold" asChild>
                  <a href="#demo">See Success Stories</a>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-green-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="font-medium text-sm sm:text-base">14-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></span>
                  <span className="font-medium text-sm sm:text-base">Results in 24 hours</span>
                </div>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm border border-white/20">
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <div className="text-4xl sm:text-6xl mb-4">💎</div>
                    <div className="text-xl sm:text-2xl font-bold text-amber-300">Premium Results</div>
                    <div className="text-green-100 text-sm sm:text-base">Without Premium Prices</div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg text-sm sm:text-base">
                      <span>Automated Tools</span>
                      <span className="text-red-300">$20-100</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-500/20 rounded-lg border border-amber-300 text-sm sm:text-base">
                      <span className="font-bold">ReelDev</span>
                      <span className="text-amber-300 font-bold">$150-800</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg text-sm sm:text-base">
                      <span>Premium Agencies</span>
                      <span className="text-red-300">$1000+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Site Footer */}
      <footer className="bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">ReelDev</h3>
              <p className="text-sm">
                AI-powered, human-perfected video repurposing for content creators and businesses.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <span className="text-lg">𝕏</span>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <span className="text-lg">💼</span>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <span className="sr-only">YouTube</span>
                  <span className="text-lg">📺</span>
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/upload" className="hover:text-white transition-colors">Video Upload</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Video Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Best Practices</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>

          <Separator className="bg-slate-800 mb-8" />

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm">
              © 2024 ReelDev. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
