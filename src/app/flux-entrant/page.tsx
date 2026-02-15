
import { Suspense } from "react";
import { InboundClient } from "@/components/modules/inbound-client";

export default function FluxEntrantPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Flux Entrant (Réception)</h1>
            <Suspense fallback={<div>Chargement...</div>}>
                <InboundClient />
            </Suspense>
        </div>
    )
}
