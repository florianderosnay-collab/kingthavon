"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface OrgData {
    name: string
    email: string
    openingLine: string
    qualificationQs: string[]
    voiceConfig?: Record<string, string | boolean>
    phoneNumber?: string
    plan?: string
}

export function SettingsForm() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [org, setOrg] = useState<OrgData | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        fetch('/api/organization')
            .then(res => res.json())
            .then(data => {
                if (data.org) {
                    setOrg(data.org)
                } else {
                    setError("Failed to load organization")
                }
            })
            .catch(err => setError("Network error"))
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        if (!org) return;
        setSaving(true)
        try {
            const res = await fetch('/api/organization', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // specifically only updating what is allowed here, 
                    // although the API might support more, we want to be explicit
                    // Actually the API PUT supports openingLine and qualificationQs.
                    // We need to update the API to support name/email updates if that was the plan.
                    // Checking API... it only updates openingLine/qualificationQs.
                    // I need to update the API first or currently I can't update name/email.

                    // Wait, looking at previous API code:
                    // const { openingLine, qualificationQs } = body;
                    // It extracts those. I need to update the API to extract name and email too.

                    name: org.name,
                    email: org.email,
                    voiceConfig: org.voiceConfig
                })
            })

            if (!res.ok) throw new Error("Failed to save")
            // Show success?
        } catch (e) {
            setError("Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div><Loader2 className="h-8 w-8 animate-spin" /></div>
    if (!org) return <div>Error loading settings: {error}</div>

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Organization Profile</CardTitle>
                    <CardDescription>
                        Manage your agency details and notification preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Agency Name</Label>
                        <Input
                            id="name"
                            value={org.name}
                            onChange={(e) => setOrg({ ...org, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Notification Email</Label>
                        <Input
                            id="email"
                            value={org.email}
                            onChange={(e) => setOrg({ ...org, email: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Call summaries/transcripts will be sent here.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Voice Intelligence</CardTitle>
                    <CardDescription>
                        Configure how smart and capable your AI receptionist is.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>AI Model</Label>
                        <div className="flex gap-4">
                            <Button
                                variant={org.voiceConfig?.model === 'gpt-4o-mini' || !org.voiceConfig?.model ? "default" : "outline"}
                                onClick={() => setOrg({ ...org, voiceConfig: { ...org.voiceConfig, model: 'gpt-4o-mini' } })}
                                className="w-full"
                            >
                                Speed (Recommended)
                                <span className="ml-2 text-xs opacity-70">GPT-4o Mini</span>
                            </Button>
                            <Button
                                variant={org.voiceConfig?.model === 'gpt-4o' ? "default" : "outline"}
                                onClick={() => setOrg({ ...org, voiceConfig: { ...org.voiceConfig, model: 'gpt-4o' } })}
                                className="w-full"
                            >
                                Intelligence
                                <span className="ml-2 text-xs opacity-70">GPT-4o</span>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Speed is best for simple reception. Intelligence is better for complex queries.
                        </p>
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Automated Actions</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow the AI to book appointments and check availability.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant={org.voiceConfig?.useTools !== false ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setOrg({ ...org, voiceConfig: { ...org.voiceConfig, useTools: org.voiceConfig?.useTools === false } })}
                            >
                                {org.voiceConfig?.useTools !== false ? "Enabled" : "Disabled"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Voice Configuration</CardTitle>
                    <CardDescription>
                        Your AI receptionist&apos;s active phone line.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input value={org.phoneNumber} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">
                            Contact support to change your number.
                        </p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                            <p className="font-medium capitalize">{org.plan} Plan</p>
                            <p className="text-sm text-muted-foreground">Active</p>
                        </div>
                        <Button variant="outline" onClick={async () => {
                            try {
                                const endpoint = org.plan === 'core' ? '/api/stripe/checkout' : '/api/stripe/portal';
                                const res = await fetch(endpoint, { method: 'POST' });
                                const data = await res.json();
                                if (data.url) window.location.href = data.url;
                            } catch (e) {
                                console.error(e);
                                alert("Failed to redirect to billing");
                            }
                        }}>
                            {org.plan === 'core' ? 'Upgrade to Growth' : 'Manage Billing'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
