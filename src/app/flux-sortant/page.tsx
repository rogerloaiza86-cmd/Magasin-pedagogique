
import { Suspense } from "react";
import { OutboundClient } from "@/components/modules/outbound-client";

export default function FluxSortantPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Flux Sortant (Expédition)</h1>
            <Suspense fallback={<div>Chargement...</div>}>
                <OutboundClient />
            </Suspense>
        </div>
    )
}
