import { DocumentsClient } from "@/components/modules/documents-client";

export default function DocumentsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Historique des Documents</h1>
            <DocumentsClient />
        </div>
    )
}
