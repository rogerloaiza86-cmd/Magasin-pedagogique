
import { EnvironmentsClient } from "@/components/modules/environments-client";

export default function EnvironmentsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Gestion des Environnements</h1>
            <EnvironmentsClient />
        </div>
    )
}
