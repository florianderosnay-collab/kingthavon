"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash, Plus } from "lucide-react"

export function ScriptEditor() {
    const [openingLine, setOpeningLine] = useState("")
    const [qualificationQs, setQualificationQs] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        fetch('/api/organization')
            .then(res => res.json())
            .then(data => {
                if (data.org) {
                    setOpeningLine(data.org.openingLine || "")
                    setQualificationQs(data.org.qualificationQs || [])
                } else {
                    // Start with defaults if no data
                    setOpeningLine("")
                    setQualificationQs(["Are you looking to buy or sell?", "What is your budget?"])
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError("Failed to load script data")
                setLoading(false)
            })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/organization', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openingLine, qualificationQs: qualificationQs.filter(q => q.trim() !== "") })
            })

            if (!res.ok) throw new Error('Failed to save')

            // Optional: Success notification
        } catch (error) {
            console.error(error)
            setError("Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    const addQuestion = () => setQualificationQs([...qualificationQs, ""])

    const updateQuestion = (index: number, val: string) => {
        const newQs = [...qualificationQs]
        newQs[index] = val
        setQualificationQs(newQs)
    }

    const removeQuestion = (index: number) => {
        setQualificationQs(qualificationQs.filter((_, i) => i !== index))
    }

    // Skeleton for loading state
    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>Script Configuration</CardTitle></CardHeader>
                <CardContent>Loading script...</CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Script Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

                <div className="space-y-2">
                    <Label htmlFor="opening-line">Opening Line</Label>
                    <Textarea
                        id="opening-line"
                        value={openingLine}
                        onChange={(e) => setOpeningLine(e.target.value)}
                        placeholder="Hi, thanks for calling [Agency Name]. How can I help you today?"
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">The first sentence the AI will speak when answering the call.</p>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label>Qualification Questions</Label>
                        <Button variant="ghost" size="sm" onClick={addQuestion} className="h-8">
                            <Plus className="h-4 w-4 mr-1" /> Add Question
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {qualificationQs.map((q, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <div className="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                                    {i + 1}
                                </div>
                                <Input
                                    value={q}
                                    onChange={(e) => updateQuestion(i, e.target.value)}
                                    placeholder="Enter a qualification question..."
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuestion(i)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {qualificationQs.length === 0 && (
                            <div className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                                No qualification questions configured.
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving Changes..." : "Save Script"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
