"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Phone, FileSpreadsheet, Loader2 } from "lucide-react"
import Papa from "papaparse"

export default function LeadsPage() {
    // Mock Data for Visualization
    const MOCK_LEADS = [
        { id: '1', name: 'John Doe', phone: '+15550101', address: '123 Maple St', status: 'new', lastCall: null },
        { id: '2', name: 'Jane Smith', phone: '+15550102', address: '456 Oak Ave', status: 'contacted', lastCall: '2023-10-25T14:30:00Z' },
        { id: '3', name: 'Robert Johnson', phone: '+15550103', address: '789 Pine Ln', status: 'calling', lastCall: '2023-10-26T09:15:00Z' },
    ]

    const [leads, setLeads] = useState<any[]>(MOCK_LEADS)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [callingId, setCallingId] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const parsedLeads = results.data.map((row: any, index: number) => ({
                    id: `temp-${Date.now()}-${index}`, // Temp ID for visualization
                    name: row.Name || row.name || 'Unknown',
                    phone: row.Phone || row.phone,
                    address: row.Address || row.address,
                    status: 'new',
                    lastCall: null
                })).filter((l: any) => l.phone)

                if (parsedLeads.length === 0) {
                    alert("No valid contacts found in CSV")
                    setIsUploading(false)
                    return
                }

                // Simulate processing/upload for visualization
                setTimeout(() => {
                    setLeads(prev => [...parsedLeads, ...prev])
                    setIsUploading(false)
                    if (event.target) event.target.value = ''
                }, 1000)
            }
        })
    }

    const initiateCall = async (leadId: string) => {
        setCallingId(leadId)

        // Simulating call initiation for visualization
        setTimeout(() => {
            console.log("Calling lead:", leadId)
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'calling', lastCall: new Date().toISOString() } : l))
            setCallingId(null)
        }, 1500)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">New</span>
            case 'calling': return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Calling</span>
            case 'contacted': return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Contacted</span>
            case 'qualified': return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Qualified</span>
            default: return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{status}</span>
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Leads & FSBO Output</h2>
                    <p className="text-muted-foreground mt-1">
                        Upload leads and manage outbound calls (Preview Mode).
                    </p>
                </div>
                <div>
                    <input
                        type="file"
                        id="csv-upload"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <label htmlFor="csv-upload">
                        <Button variant="outline" className="cursor-pointer border-white/20 hover:bg-white/10" asChild disabled={isUploading}>
                            <span>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {isUploading ? 'Importing...' : 'Import CSV'}
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            <Card className="bg-[#111827] border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                        Your Leads ({leads.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No leads found. Upload a CSV to get started.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-zinc-400">Name</TableHead>
                                    <TableHead className="text-zinc-400">Phone</TableHead>
                                    <TableHead className="text-zinc-400">Address</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead className="text-zinc-400">Last Call</TableHead>
                                    <TableHead className="text-right text-zinc-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-white">{lead.name}</TableCell>
                                        <TableCell className="text-zinc-300">{lead.phone}</TableCell>
                                        <TableCell className="text-zinc-300">{lead.address || '-'}</TableCell>
                                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                        <TableCell className="text-sm text-zinc-500">
                                            {mounted && lead.lastCall ? new Date(lead.lastCall).toLocaleString() : lead.lastCall ? 'Loading...' : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="bg-white/10 text-white hover:bg-white/20"
                                                onClick={() => initiateCall(lead.id)}
                                                disabled={callingId === lead.id || lead.status === 'calling'}
                                            >
                                                {callingId === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                                                Call
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
