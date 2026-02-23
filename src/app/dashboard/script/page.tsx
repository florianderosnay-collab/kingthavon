export const runtime = 'edge';

import { ScriptEditor } from "@/components/script-editor"

export default function ScriptPage() {
    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Script Editor</h2>
                <p className="text-muted-foreground mt-1">
                    Customize how your AI receptionist answers and qualifies leads.
                </p>
            </div>

            <ScriptEditor />
        </div>
    )
}
