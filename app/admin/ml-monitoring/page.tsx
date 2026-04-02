"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Brain,
  CheckCircle2,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { api } from "@/lib/api-client"

export default function MLMonitoringPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  async function fetchMetrics() {
    try {
      setLoading(true)
      const response: any = await api.get("/api/admin/ml-metrics")
      setMetrics(response.data)
    } catch (error) {
      console.error("Failed to fetch ML metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ML Monitoring</h1>
          <p className="text-sm text-muted-foreground">AI moderation pipeline performance and model health</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchMetrics}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {metrics?.models.map((model: any) => (
          <Card key={model.name}>
            <CardHeader className="pb-3 text-foreground">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{model.name}</CardTitle>
                <Badge variant="outline" className="bg-success/10 text-success">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {model.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-foreground">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Accuracy</span>
                  <span className="font-mono text-sm font-bold">{model.accuracy}%</span>
                </div>
                <Progress value={model.accuracy} className="h-1.5" />
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Latency</p>
                    <p className="font-mono text-sm font-medium">{model.latency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requests</p>
                    <p className="font-mono text-sm font-medium">{model.requests}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="text-foreground">
            <CardTitle className="text-base">Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis domain={[90, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--card-foreground)",
                    }}
                  />
                  <Line type="monotone" dataKey="rule" stroke="var(--chart-3)" strokeWidth={2} name="Rule Engine" />
                  <Line type="monotone" dataKey="llm" stroke="var(--chart-2)" strokeWidth={2} name="LLM" />
                  <Line type="monotone" dataKey="hybrid" stroke="var(--chart-1)" strokeWidth={2} name="Hybrid" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-foreground">
            <CardTitle className="text-base">Category Performance</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground">
            <div className="flex flex-col gap-3">
              {metrics?.categoryPerformance.map((cat: any) => (
                <div key={cat.cat} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium">{cat.cat}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <Progress value={cat.val} className="h-2 flex-1" />
                    <span className="w-10 text-right font-mono text-xs text-muted-foreground">{cat.val}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-foreground">
          <CardTitle className="text-base">Pipeline Control</CardTitle>
        </CardHeader>
        <CardContent className="text-foreground">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Rule-Based Engine</Label>
                  <p className="text-xs text-muted-foreground">Local keyword and pattern matching</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>OpenRouter LLM Fallback</Label>
                  <p className="text-xs text-muted-foreground">Deep analysis for borderline content</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Auto-Action Pipeline</Label>
                  <p className="text-xs text-muted-foreground">Automatically action tickets with {">"} 95% confidence</p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
