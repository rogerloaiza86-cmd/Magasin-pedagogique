
"use client";

import { useWms } from "@/context/WmsContext";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Document } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function DocumentDetailPage() {
    const { id } = useParams();
    const { state, getDocument, getTier, getArticle } = useWms();
    const docId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    const doc = getDocument(docId);
    
    if (!doc) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Document non trouvé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Le document avec l'ID "{docId}" n'a pas pu être trouvé.</p>
                         <Button asChild variant="link" className="px-0">
                            <Link href="/documents">Retour à la liste des documents</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const tier = getTier(doc.tierId);
    const creator = state.users.get(doc.createdBy);
    const creatorRole = creator ? state.roles.get(creator.roleId)?.name : '';

    const getStatusVariant = (status: Document['status']): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'En préparation': return 'secondary';
            case 'Validé':
            case 'Réceptionné':
            case 'Expédié':
            case 'Accepté':
            case 'Traité':
            case 'Prêt pour expédition':
                return 'default';
            case 'Réceptionné avec anomalies':
            case 'Refusé':
                return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="space-y-6">
            <Link href="/documents" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Retour à l'historique
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{doc.type} #{doc.id}</CardTitle>
                            <CardDescription>Créé le {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm')} par {doc.createdBy} ({creatorRole})</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(doc.status)} className="text-base">{doc.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>{doc.type.includes('Fournisseur') ? 'Fournisseur' : doc.type.includes('Client') ? 'Client' : 'Tiers'}</CardDescription>
                                    <CardTitle>{tier?.name || 'N/A'}</CardTitle>
                                </CardHeader>
                                {tier?.address && <CardContent><p className="text-muted-foreground">{tier.address}</p></CardContent>}
                            </Card>
                            {doc.transporterId && (
                                <Card>
                                     <CardHeader className="pb-2">
                                        <CardDescription>Transporteur</CardDescription>
                                        <CardTitle>{getTier(doc.transporterId)?.name || 'N/A'}</CardTitle>
                                    </CardHeader>
                                </Card>
                            )}
                        </div>
                         <div className="space-y-4">
                            {doc.receptionNotes && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Réserves / Notes</CardDescription>
                                        <CardContent className="p-0 pt-2"><p>{doc.receptionNotes}</p></CardContent>
                                    </CardHeader>
                                </Card>
                            )}
                         </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lignes du document</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>Désignation</TableHead>
                                <TableHead>Qté Commandée</TableHead>
                                {doc.type === "Bon de Commande Fournisseur" && doc.status.startsWith("Réceptionné") && <TableHead>Qté Reçue</TableHead>}
                                {doc.type === "Bon de Commande Fournisseur" && doc.status.startsWith("Réceptionné") && <TableHead>Qté Non-conforme</TableHead>}
                                {doc.type === "Retour Client" && <TableHead>Raison du retour</TableHead>}
                                {doc.type === "Retour Client" && doc.status === "Traité" && <TableHead>Décision</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doc.lines.length > 0 ? doc.lines.map((line, index) => {
                                const article = getArticle(line.articleId);
                                return (
                                <TableRow key={index}>
                                    <TableCell className="font-mono">{line.articleId}</TableCell>
                                    <TableCell>{article?.name}</TableCell>
                                    <TableCell>{line.quantity}</TableCell>
                                    {doc.type === "Bon de Commande Fournisseur" && doc.status.startsWith("Réceptionné") && <TableCell>{line.quantityReceived}</TableCell>}
                                    {doc.type === "Bon de Commande Fournisseur" && doc.status.startsWith("Réceptionné") && <TableCell className="text-destructive font-semibold">{line.quantityNonConforming}</TableCell>}
                                    {doc.type === "Retour Client" && <TableCell>{line.returnReason}</TableCell>}
                                    {doc.type === "Retour Client" && doc.status === "Traité" && <TableCell>{line.returnDecision}</TableCell>}
                                </TableRow>
                            )}) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun article dans ce document.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}

    
