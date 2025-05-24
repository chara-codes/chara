"use client"

import { ThemeProvider } from "styled-components"
import { UIStoreProvider } from "../src/store/ui-store"
import ChatOverlayPanel from "../src/components/templates/chat-overlay-panel"
import GlobalStyles from "../src/styles/global-styles"
import { theme } from "../src/styles/theme"
import { useEffect, useState } from "react"
import Image from "next/image"

// Import shadcn/ui components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Import icons
import {
  Check,
  Moon,
  Sun,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Rocket,
  Heart,
  Star,
  MessageCircle,
  Users,
  ArrowRight,
  ChevronRight,
  Play,
  Lightbulb,
  Coffee,
  Music,
  Palette,
} from "lucide-react"

// Configuration for the chat overlay panel
const chatConfig = {
  defaultOpen: false, // Start closed to better see the page content
  position: "right" as const,
  offset: {
    bottom: 20,
    right: 20,
  },
}

export default function HomePage() {
  // Use state to handle client-side rendering
  const [isMounted, setIsMounted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Only render the chat panel on the client side
  useEffect(() => {
    setIsMounted(true)

    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-background text-foreground relative">
        {/* Decorative Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-purple-200 dark:bg-purple-900/20 blur-[120px] opacity-30"></div>
          <div className="absolute -bottom-[40%] -left-[30%] w-[80%] h-[80%] rounded-full bg-blue-200 dark:bg-blue-900/20 blur-[120px] opacity-30"></div>
          <div className="absolute top-[20%] left-[10%] w-[20%] h-[20%] rounded-full bg-pink-200 dark:bg-pink-900/20 blur-[80px] opacity-20"></div>
        </div>

        {/* Header */}
        <header
          className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
            scrollPosition > 50 ? "bg-background/80 shadow-md" : "bg-transparent"
          }`}
        >
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-purple-500" />
                <div className="absolute -inset-1 bg-purple-500/20 blur-sm rounded-full -z-10"></div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
                CreativeLab
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" className="group relative overflow-hidden">
                <span>Explore</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
              </Button>
              <Button variant="ghost" className="group relative overflow-hidden">
                <span>Features</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
              </Button>
              <Button variant="ghost" className="group relative overflow-hidden">
                <span>Showcase</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
              </Button>
              <Button variant="ghost" className="group relative overflow-hidden">
                <span>Community</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
              </Button>
            </nav>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} aria-label="Toggle dark mode" />
              </div>
              <Avatar className="border-2 border-purple-500/20 transition-all hover:border-purple-500/50">
                <AvatarImage src="/creative-avatar.png" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">CR</AvatarFallback>
              </Avatar>
              <Button className="md:hidden" variant="ghost" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 md:py-32">
            <div className="container relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                    >
                      New
                    </Badge>
                    <span>Unleash your creative potential</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                    Where <span className="text-purple-600 dark:text-purple-400">imagination</span> meets{" "}
                    <span className="text-blue-600 dark:text-blue-400">innovation</span>
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Discover a platform that empowers creators, designers, and innovators to bring their ideas to life.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      size="lg"
                      className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-500 text-white border-0"
                    >
                      <span className="relative z-10">Get Started</span>
                      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button size="lg" variant="outline" className="group">
                      <Play className="mr-2 h-4 w-4" />
                      <span>Watch Demo</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex -space-x-2">
                      <Avatar className="border-2 border-background">
                        <AvatarImage src="/user-avatar-1.png" alt="User" />
                        <AvatarFallback>U1</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarImage src="/user-avatar-2.png" alt="User" />
                        <AvatarFallback>U2</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarImage src="/user-avatar-3.png" alt="User" />
                        <AvatarFallback>U3</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarImage src="/user-avatar-4.png" alt="User" />
                        <AvatarFallback>U4</AvatarFallback>
                      </Avatar>
                    </div>
                    <span>Join 10,000+ creators worldwide</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl -z-10 opacity-70"></div>
                  <div className="relative bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-3xl p-1 shadow-xl">
                    <Image
                      src="/creative-dashboard.png"
                      alt="Creative Dashboard"
                      className="rounded-2xl shadow-lg"
                      width={600}
                      height={400}
                      style={{ width: "100%", height: "auto" }}
                    />
                    <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full p-3 shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-conic from-purple-500/40 via-transparent to-blue-500/40 opacity-30 blur-3xl -z-10"></div>
          </section>

          {/* Features Section */}
          <section className="py-20 relative">
            <div className="container">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge className="mb-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                  Features
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful tools for creative minds</h2>
                <p className="text-muted-foreground text-lg">
                  Our platform provides everything you need to design, create, and innovate without limitations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Zap className="h-10 w-10 text-yellow-500" />,
                    title: "Lightning Fast",
                    description: "Experience unparalleled speed and performance with our optimized platform.",
                    color: "from-yellow-500/20 to-yellow-600/20",
                    iconBg: "bg-yellow-500",
                  },
                  {
                    icon: <Shield className="h-10 w-10 text-green-500" />,
                    title: "Secure & Private",
                    description: "Your data is protected with enterprise-grade security and privacy controls.",
                    color: "from-green-500/20 to-green-600/20",
                    iconBg: "bg-green-500",
                  },
                  {
                    icon: <Globe className="h-10 w-10 text-blue-500" />,
                    title: "Global Collaboration",
                    description: "Work seamlessly with team members and clients across the globe.",
                    color: "from-blue-500/20 to-blue-600/20",
                    iconBg: "bg-blue-500",
                  },
                  {
                    icon: <Rocket className="h-10 w-10 text-purple-500" />,
                    title: "Boost Productivity",
                    description: "Streamline your workflow and accomplish more in less time.",
                    color: "from-purple-500/20 to-purple-600/20",
                    iconBg: "bg-purple-500",
                  },
                  {
                    icon: <Heart className="h-10 w-10 text-red-500" />,
                    title: "Designed with Love",
                    description: "Every detail crafted with care to provide the best user experience.",
                    color: "from-red-500/20 to-red-600/20",
                    iconBg: "bg-red-500",
                  },
                  {
                    icon: <Star className="h-10 w-10 text-amber-500" />,
                    title: "Premium Quality",
                    description: "Top-tier tools and resources to help you create professional-grade work.",
                    color: "from-amber-500/20 to-amber-600/20",
                    iconBg: "bg-amber-500",
                  },
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="group border-0 bg-gradient-to-br bg-opacity-50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, ${feature.color.split(" ")[0].replace("from-", "var(--")}, ${feature.color.split(" ")[1].replace("to-", "var(--")})`,
                    }}
                  >
                    <CardHeader>
                      <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                        <div
                          className={`absolute inset-0 ${feature.iconBg} opacity-10 group-hover:opacity-20 transition-opacity`}
                        ></div>
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="group p-0 h-auto">
                        <span>Learn more</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Creative Showcase */}
          <section className="py-20 bg-muted/50">
            <div className="container">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge className="mb-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                  Showcase
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Inspiring creations</h2>
                <p className="text-muted-foreground text-lg">
                  Explore stunning projects created by our community of talented designers and creators.
                </p>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="bg-background/50 backdrop-blur-sm">
                    <TabsTrigger value="all">All Projects</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="illustration">Illustration</TabsTrigger>
                    <TabsTrigger value="3d">3D Art</TabsTrigger>
                    <TabsTrigger value="motion">Motion</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        title: "Neon Dreams",
                        creator: "Alex Chen",
                        image: "/showcase-1.png",
                        likes: 423,
                        comments: 56,
                        category: "Illustration",
                      },
                      {
                        title: "Abstract Thoughts",
                        creator: "Maya Johnson",
                        image: "/showcase-2.png",
                        likes: 287,
                        comments: 34,
                        category: "Design",
                      },
                      {
                        title: "Future City",
                        creator: "Jamal Williams",
                        image: "/showcase-3.png",
                        likes: 512,
                        comments: 78,
                        category: "3D Art",
                      },
                      {
                        title: "Fluid Motion",
                        creator: "Sophia Garcia",
                        image: "/showcase-4.png",
                        likes: 345,
                        comments: 42,
                        category: "Motion",
                      },
                      {
                        title: "Geometric Harmony",
                        creator: "David Kim",
                        image: "/showcase-5.png",
                        likes: 389,
                        comments: 51,
                        category: "Design",
                      },
                      {
                        title: "Cosmic Journey",
                        creator: "Elena Petrova",
                        image: "/showcase-6.png",
                        likes: 476,
                        comments: 63,
                        category: "Illustration",
                      },
                    ].map((project, index) => (
                      <Card key={index} className="overflow-hidden group border-0 shadow-md">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={project.image || "/placeholder.svg"}
                            alt={project.title}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                            width={400}
                            height={300}
                            style={{ width: "100%", height: "100%" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div className="text-white">
                              <h3 className="font-bold text-lg">{project.title}</h3>
                              <p className="text-sm text-white/80">{project.category}</p>
                            </div>
                          </div>
                          <Badge className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white border-0">
                            {project.category}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{project.creator.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{project.creator}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground text-sm">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{project.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{project.comments}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Other tab contents would be similar but filtered by category */}
                <TabsContent value="design" className="mt-0">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Showing design projects...</p>
                  </div>
                </TabsContent>
                <TabsContent value="illustration" className="mt-0">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Showing illustration projects...</p>
                  </div>
                </TabsContent>
                <TabsContent value="3d" className="mt-0">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Showing 3D art projects...</p>
                  </div>
                </TabsContent>
                <TabsContent value="motion" className="mt-0">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Showing motion projects...</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="text-center mt-12">
                <Button size="lg" variant="outline" className="group">
                  <span>View All Projects</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500/5 to-blue-500/5 -z-10"></div>
            <div className="container relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge className="mb-4 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  Testimonials
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">What our community says</h2>
                <p className="text-muted-foreground text-lg">
                  Hear from the creative professionals who have transformed their workflow with our platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    quote:
                      "This platform has completely transformed how I approach my creative projects. The tools are intuitive and powerful, allowing me to bring my visions to life faster than ever.",
                    author: "Sarah Johnson",
                    role: "Digital Artist",
                    avatar: "/testimonial-1.png",
                    color: "border-purple-500/20 bg-purple-500/5",
                  },
                  {
                    quote:
                      "As a design team lead, I needed a solution that would streamline our collaboration while maintaining the highest quality standards. This platform exceeded all my expectations.",
                    author: "Michael Chen",
                    role: "Design Director",
                    avatar: "/testimonial-2.png",
                    color: "border-blue-500/20 bg-blue-500/5",
                  },
                  {
                    quote:
                      "The community aspect is what truly sets this platform apart. Being able to connect with other creators, share ideas, and get feedback has been invaluable for my growth as an artist.",
                    author: "Elena Rodriguez",
                    role: "Freelance Illustrator",
                    avatar: "/testimonial-3.png",
                    color: "border-green-500/20 bg-green-500/5",
                  },
                ].map((testimonial, index) => (
                  <Card
                    key={index}
                    className={`border ${testimonial.color} backdrop-blur-sm hover:shadow-lg transition-all duration-300`}
                  >
                    <CardContent className="pt-6">
                      <div className="mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="inline-block h-5 w-5 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                      <p className="text-muted-foreground italic mb-6">"{testimonial.quote}"</p>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-background">
                          <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                          <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Creative Process */}
          <section className="py-20 bg-muted/30">
            <div className="container">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge className="mb-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  Process
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">How inspiration becomes reality</h2>
                <p className="text-muted-foreground text-lg">
                  Our platform guides you through every step of the creative journey, from concept to completion.
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-blue-500 hidden md:block"></div>

                {[
                  {
                    icon: <Lightbulb className="h-8 w-8 text-yellow-500" />,
                    title: "Ideation",
                    description:
                      "Capture your ideas using our brainstorming tools. Organize thoughts, create mind maps, and develop concepts in a flexible, intuitive environment.",
                    color: "border-yellow-500/20 bg-yellow-500/5",
                    iconBg: "bg-yellow-500",
                  },
                  {
                    icon: <Palette className="h-8 w-8 text-purple-500" />,
                    title: "Design",
                    description:
                      "Bring your ideas to life with our powerful design tools. Create stunning visuals, illustrations, and layouts with precision and ease.",
                    color: "border-purple-500/20 bg-purple-500/5",
                    iconBg: "bg-purple-500",
                  },
                  {
                    icon: <Users className="h-8 w-8 text-blue-500" />,
                    title: "Collaboration",
                    description:
                      "Share your work with team members and clients. Gather feedback, make revisions, and collaborate in real-time to refine your creation.",
                    color: "border-blue-500/20 bg-blue-500/5",
                    iconBg: "bg-blue-500",
                  },
                  {
                    icon: <Rocket className="h-8 w-8 text-green-500" />,
                    title: "Launch",
                    description:
                      "Finalize your project and prepare it for the world. Export in multiple formats, publish directly to various platforms, or share with your audience.",
                    color: "border-green-500/20 bg-green-500/5",
                    iconBg: "bg-green-500",
                  },
                ].map((step, index) => (
                  <div
                    key={index}
                    className={`relative md:grid md:grid-cols-2 gap-8 items-center mb-12 ${index % 2 === 1 ? "md:rtl" : ""}`}
                  >
                    <div className={`${index % 2 === 1 ? "md:text-right" : ""} md:ltr`}>
                      <div className="bg-background rounded-lg p-8 shadow-md border-t-4 transition-all hover:shadow-lg relative">
                        <div
                          className={`absolute top-0 left-0 w-full h-1 rounded-t-lg ${step.iconBg}`}
                          style={{ opacity: 0.7 }}
                        ></div>
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${step.iconBg} bg-opacity-10`}
                          >
                            {step.icon}
                          </div>
                          <h3 className="text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    <div className="hidden md:block"></div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold hidden md:flex">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Creative Tools */}
          <section className="py-20 relative overflow-hidden">
            <div className="container relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge className="mb-4 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Tools</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Creative tools for every need</h2>
                <p className="text-muted-foreground text-lg">
                  Explore our suite of specialized tools designed to enhance your creative workflow.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500/5 to-blue-500/5 backdrop-blur-sm">
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src="/tool-design-studio.png"
                      alt="Design Studio"
                      className="object-cover w-full h-full"
                      width={600}
                      height={400}
                      style={{ width: "100%", height: "100%" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-purple-500 text-white border-0">Design Studio</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-2">Advanced Design Studio</h3>
                    <p className="text-muted-foreground mb-4">
                      A comprehensive design environment with powerful vector editing, typography controls, and layout
                      tools.
                    </p>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="features">
                        <AccordionTrigger>Key Features</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Precision vector editing tools</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Advanced typography controls</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Responsive layout design</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Real-time collaboration</span>
                            </li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter className="px-6 pb-6 pt-0">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white border-0">
                      Explore Design Studio
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-red-500/5 backdrop-blur-sm">
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src="/tool-motion-lab.png"
                      alt="Motion Lab"
                      className="object-cover w-full h-full"
                      width={600}
                      height={400}
                      style={{ width: "100%", height: "100%" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-amber-500 text-white border-0">Motion Lab</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-2">Motion Lab</h3>
                    <p className="text-muted-foreground mb-4">
                      Create stunning animations and motion graphics with our intuitive timeline-based editor.
                    </p>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="features">
                        <AccordionTrigger>Key Features</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Keyframe animation tools</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Motion presets library</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Audio synchronization</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Export to multiple formats</span>
                            </li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter className="px-6 pb-6 pt-0">
                    <Button className="w-full bg-gradient-to-r from-amber-600 to-red-500 text-white border-0">
                      Explore Motion Lab
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                {[
                  {
                    title: "Color Studio",
                    description: "Create and manage color palettes with advanced color theory tools.",
                    icon: <Palette className="h-6 w-6 text-pink-500" />,
                    color: "border-pink-500/20 bg-pink-500/5",
                  },
                  {
                    title: "Font Foundry",
                    description: "Explore thousands of fonts and typography tools for perfect text design.",
                    icon: <span className="text-xl font-serif text-blue-500">A</span>,
                    color: "border-blue-500/20 bg-blue-500/5",
                  },
                  {
                    title: "3D Workshop",
                    description: "Create and manipulate 3D models with our accessible modeling tools.",
                    icon: <span className="text-xl text-green-500">3D</span>,
                    color: "border-green-500/20 bg-green-500/5",
                  },
                  {
                    title: "Audio Lab",
                    description: "Edit and enhance audio for your multimedia projects.",
                    icon: <Music className="h-6 w-6 text-purple-500" />,
                    color: "border-purple-500/20 bg-purple-500/5",
                  },
                  {
                    title: "Photo Editor",
                    description: "Professional-grade photo editing with AI-powered enhancements.",
                    icon: <span className="text-xl text-amber-500">📷</span>,
                    color: "border-amber-500/20 bg-amber-500/5",
                  },
                  {
                    title: "Prototype Builder",
                    description: "Create interactive prototypes for websites and applications.",
                    icon: <Coffee className="h-6 w-6 text-red-500" />,
                    color: "border-red-500/20 bg-red-500/5",
                  },
                ].map((tool, index) => (
                  <Card key={index} className={`border ${tool.color} hover:shadow-md transition-all duration-300`}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tool.color}`}>
                        {tool.icon}
                      </div>
                      <CardTitle>{tool.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{tool.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="group p-0 h-auto">
                        <span>Learn more</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 -z-10"></div>
            <div className="absolute inset-0 bg-[url('/pattern-dots.png')] bg-repeat opacity-5 -z-10"></div>
            <div className="container relative z-10">
              <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-conic from-purple-500/20 via-transparent to-blue-500/20 opacity-30 animate-slow-spin -z-10"></div>
                <Badge className="mb-4 bg-white/10 text-white backdrop-blur-sm border-white/20">Join Today</Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text">
                  Unleash your creative potential
                </h2>
                <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                  Join thousands of creators who have transformed their workflow and taken their projects to the next
                  level.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90">
                    Get Started Free
                  </Button>
                  <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10">
                    Schedule a Demo
                  </Button>
                </div>
                <div className="mt-8 text-white/60 text-sm">No credit card required for free plan</div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-muted/30 border-t py-12">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
                    CreativeLab
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Empowering creators to bring their ideas to life with powerful tools and a supportive community.
                </p>
                <div className="flex gap-4">
                  {["twitter", "instagram", "facebook", "youtube"].map((social) => (
                    <Button key={social} variant="ghost" size="icon" className="h-8 w-8">
                      <span className="sr-only">{social}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-sm">
                  {["Features", "Pricing", "Showcase", "Roadmap", "Updates"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-muted-foreground hover:text-foreground">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-sm">
                  {["Documentation", "Tutorials", "Blog", "Community", "Support"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-muted-foreground hover:text-foreground">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  {["About", "Careers", "Press", "Partners", "Contact"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-muted-foreground hover:text-foreground">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground">© 2023 CreativeLab. All rights reserved.</p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Chat Overlay Panel */}
        {isMounted && (
          <UIStoreProvider>
            <ThemeProvider theme={theme}>
              <GlobalStyles />
              <ChatOverlayPanel
                defaultOpen={chatConfig.defaultOpen}
                position={chatConfig.position}
                offset={chatConfig.offset}
              />
            </ThemeProvider>
          </UIStoreProvider>
        )}
      </div>
    </div>
  )
}
