"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Phone } from "lucide-react"

export function TestCallDialog() {
    const [phoneNumber, setPhoneNumber] = useState("")
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCall = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/calls/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber })
            })

            const data = await res.json()

            if (res.ok) {
                setOpen(false)
                // Could show success toast
            } else {
                setError(data.error || "Failed to start call")
            }
        } catch (error) {
            console.error(error)
            setError("Network error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Phone className="mr-2 h-4 w-4" />
                    Test Call
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Make a Test Call</DialogTitle>
                    <DialogDescription>
                        Enter a phone number to receive a call from your AI assistant.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            placeholder="+1234567890"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Must verify number or use own number in trial mode.</p>
                    </div>
                    <Button onClick={handleCall} disabled={loading || !phoneNumber} className="w-full">
                        {loading ? "Calling..." : "Start Call"} {!loading && <Phone className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
