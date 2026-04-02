"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Brain,
  Shield,
  Database,
  Globe,
  Bell,
  Save,
  RotateCcw,
  AlertTriangle,
  Lock,
  Server,
  Zap,
  Key,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export default function SystemConfigPage() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      const response: any = await api.get("/api/admin/config")
      setConfig(response)
    } catch (error) {
      console.error("Failed to fetch config:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.patch("/api/admin/config", config)
      toast.success("Configuration saved successfully")
    } catch (error) {
      console.error("Failed to save config:", error)
      toast.error("Failed to save configuration")
    }
  }

  if (loading) {
    return <div className="p-6">Loading configuration...</div>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Configuration</h1>
          <p className="text-sm text-muted-foreground">Platform settings, AI configuration, and security policies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchConfig}>
            <RotateCcw className="h-4 w-4" />
            Reload
          </Button>
          <Button className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ai">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ai" className="gap-1.5">
            <Brain className="h-3.5 w-3.5" /> AI / Moderation
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Platform
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="flex flex-col gap-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Moderation Settings</CardTitle>
              <CardDescription>Configure automation thresholds</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable AI Moderation</Label>
                  <p className="text-xs text-muted-foreground">Use ML models for content screening</p>
                </div>
                <Switch
                  checked={config.enableAIModeration}
                  onCheckedChange={(checked) => setConfig({ ...config, enableAIModeration: checked })}
                />
              </div>
              <Separator />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Risk Threshold</Label>
                  <span className="font-mono text-sm text-foreground">{Math.round(config.riskThreshold * 100)}%</span>
                </div>
                <Slider
                  value={[config.riskThreshold * 100]}
                  onValueChange={(val) => setConfig({ ...config, riskThreshold: val[0] / 100 })}
                  min={10}
                  max={90}
                  step={1}
                  className="max-w-sm"
                />
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Auto-Flag (Reports)</Label>
                  <Input
                    type="number"
                    value={config.autoFlagThreshold}
                    onChange={(e) => setConfig({ ...config, autoFlagThreshold: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Auto-Remove (Reports)</Label>
                  <Input
                    type="number"
                    value={config.autoRemoveThreshold}
                    onChange={(e) => setConfig({ ...config, autoRemoveThreshold: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="flex flex-col gap-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Features</CardTitle>
              <CardDescription>Toggle global platform capabilities</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Recommendations</Label>
                  <p className="text-xs text-muted-foreground">Personalized feed and community discovery</p>
                </div>
                <Switch
                  checked={config.enableRecommendations}
                  onCheckedChange={(checked) => setConfig({ ...config, enableRecommendations: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Real-time Updates</Label>
                  <p className="text-xs text-muted-foreground">Websocket notifications and live counts</p>
                </div>
                <Switch
                  checked={config.enableRealtime}
                  onCheckedChange={(checked) => setConfig({ ...config, enableRealtime: checked })}
                />
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <Label>Max Strikes Before Ban</Label>
                <Input
                  type="number"
                  value={config.maxStrikesBeforeBan}
                  onChange={(e) => setConfig({ ...config, maxStrikesBeforeBan: parseInt(e.target.value) })}
                  className="max-w-[200px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
