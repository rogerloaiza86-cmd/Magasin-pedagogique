import { StockClient } from "@/components/modules/stock-client";

export default function StockPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Gestion des Stocks et Inventaire</h1>
            <StockClient />
        </div>
    )
}
