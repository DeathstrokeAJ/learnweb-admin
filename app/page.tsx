"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Brain,
  BarChart3,
  Users,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "SUPER_ADMIN") {
        router.push("/admin")
      } else if (user.role === "MODERATOR") {
        router.push("/moderator")
      } else {
        router.push("/moderator")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">LearnWeb</span>
            <Badge variant="secondary" className="text-xs">Admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="flex flex-col items-center gap-6 text-center">
          <Badge variant="outline" className="gap-1.5">
            <Zap className="h-3 w-3" />
            AI-Powered Platform
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Social Learning with
            <span className="text-primary"> Intelligent Moderation</span>
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Enterprise-grade content moderation and community management for educational platforms.
            AI-powered risk scoring, real-time threat detection, and comprehensive admin controls.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Managing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In to Dashboard</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Brain}
            title="AI Content Moderation"
            description="Rule-based local checks with OpenRouter LLM fallback for borderline content. Zero false-positive tolerance with human-in-the-loop review."
          />
          <FeatureCard
            icon={BarChart3}
            title="Real-time Analytics"
            description="Live platform metrics, moderation throughput, community health scores, and ML model performance monitoring dashboards."
          />
          <FeatureCard
            icon={Users}
            title="User Risk Profiling"
            description="Behavioral scoring with trust levels, historical violation tracking, and automated escalation workflows."
          />
          <FeatureCard
            icon={Shield}
            title="Moderation Queue"
            description="Priority-based ticket system with severity tiers, auto-assignment, and bulk action capabilities for efficient moderation."
          />
          <FeatureCard
            icon={Lock}
            title="Role-Based Access"
            description="Granular permissions for moderators, senior moderators, and super admins. Complete audit logging and approval workflows."
          />
          <FeatureCard
            icon={Zap}
            title="Community Management"
            description="Community health monitoring, rule enforcement, member management, and content policy configuration."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { label: "Response Time", value: "<2s" },
              { label: "Detection Rate", value: "99.2%" },
              { label: "False Positives", value: "<0.5%" },
              { label: "Uptime SLA", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-balance text-3xl font-bold text-foreground">
            Ready to moderate smarter?
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Get started with the LearnWeb admin platform today. Set up your moderation pipeline in minutes.
          </p>
          <div className="flex flex-col items-center gap-2 pt-2">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Create Admin Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No paid APIs</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Open source</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-muted-foreground">
          <span>LearnWeb Admin Platform</span>
          <span>Built with Next.js, MongoDB, and OpenRouter</span>
        </div>
      </footer>
    </div>
  )
}
