import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, FileText } from "lucide-react"

export default function CallsPage() {
    const calls = [
        {
            id: "INV001",
            status: "completed",
            phone: "+1 (555) 123-4567",
            duration: "2m 14s",
            date: "Today, 10:42 AM",
            summary: "Buyer interested in 123 Main St. Pre-approved.",
        },
        {
            id: "INV002",
            status: "missed",
            phone: "+1 (555) 987-6543",
            duration: "0s",
            date: "Today, 9:15 AM",
            summary: "No audio detected.",
        },
        {
            id: "INV003",
            status: "completed",
            phone: "+1 (555) 234-5678",
            duration: "5m 30s",
            date: "Yesterday, 4:20 PM",
            summary: "Vendor followup regarding inspection.",
        },
        {
            id: "INV004",
            status: "failed",
            phone: "+1 (555) 876-5432",
            duration: "12s",
            date: "Yesterday, 2:10 PM",
            summary: "Call dropped.",
        },
        {
            id: "INV005",
            status: "completed",
            phone: "+1 (555) 345-6789",
            duration: "1m 45s",
            date: "Mon, 11:00 AM",
            summary: "General inquiry about open house times.",
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Call History</h2>
                <p className="text-muted-foreground mt-1">
                    View and manage your recent inbound and outbound calls.
                </p>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="max-w-[400px]">Summary</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {calls.map((call) => (
                            <TableRow key={call.id}>
                                <TableCell className="font-medium">
                                    <Badge variant={call.status === 'completed' ? 'default' : call.status === 'missed' ? 'destructive' : 'secondary'}>
                                        {call.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{call.phone}</TableCell>
                                <TableCell>{call.date}</TableCell>
                                <TableCell>{call.duration}</TableCell>
                                <TableCell className="truncate max-w-[300px]" title={call.summary}>
                                    {call.summary}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon">
                                            <Play className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
