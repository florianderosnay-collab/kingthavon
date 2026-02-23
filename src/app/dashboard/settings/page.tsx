export const runtime = 'edge';

import { SettingsForm } from "@/components/settings-form"

export default function SettingsPage() {
    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your account and preferences.
                </p>
            </div>

            <SettingsForm />
        </div>
    )
}
