
import { DevisClient } from "@/components/modules/devis-client";

export default function DevisPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Devis de Transport</h1>
            <DevisClient />
        </div>
    )
}
