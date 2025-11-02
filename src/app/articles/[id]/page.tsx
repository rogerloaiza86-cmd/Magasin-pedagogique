
"use client";

import { useWms } from "@/context/WmsContext";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Article, ArticleStatus } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";


const articleStatuses: ArticleStatus[] = ['Actif', 'Bloqué', 'En contrôle qualité', 'Obsolète', 'En attente de rangement'];

export default function ArticleDetailPage() {
    const { id } = useParams();
    const { state, getArticleWithComputedStock, dispatch, getDocument } = useWms();
    const articleId = Array.isArray(id) ? id[0] : id;
    const { toast } = useToast();

    const articleData = getArticleWithComputedStock(articleId);

    const articleMovements = state.movements
        .filter(m => m.articleId === articleId && m.environnementId === state.currentEnvironmentId)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (!articleData) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Article non trouvé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>L'article avec la référence "{articleId}" n'a pas pu être trouvé dans cet environnement.</p>
                         <Button asChild variant="link" className="px-0">
                            <Link href="/articles">Retour à la liste des articles</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    const { stockReserver, stockDisponible, ...article } = articleData;

    const getStatusVariant = (status: ArticleStatus): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'Actif': return 'default';
            case 'Bloqué': return 'destructive';
            case 'Obsolète': return 'destructive';
            case 'En contrôle qualité':
            case 'En attente de rangement':
                return 'secondary';
            default: return 'outline';
        }
    }

    const handleStatusChange = (newStatus: ArticleStatus) => {
        if (!state.currentUserPermissions?.canManageStock) {
            toast({
                variant: 'destructive',
                title: 'Permission refusée',
                description: "Vous n'avez pas les droits pour modifier le statut de l'article."
            });
            return;
        }
        dispatch({ type: 'UPDATE_ARTICLE_STATUS', payload: { articleId: article.id, status: newStatus }});
        toast({
            title: 'Statut mis à jour',
            description: `Le statut de l'article ${article.name} est maintenant "${newStatus}".`
        });
    }

    return (
        <div className="space-y-6">
            <Link href="/articles" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Retour à la liste des articles
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{article.name}</CardTitle>
                            <CardDescription>Référence: {article.id}</CardDescription>
                        </div>
                         <div className="w-48">
                            <Select onValueChange={handleStatusChange} defaultValue={article.status} disabled={!state.currentUserPermissions?.canManageStock}>
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        <Badge variant={getStatusVariant(article.status)}>{article.status}</Badge>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {articleStatuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                            <Badge variant={getStatusVariant(status)}>{status}</Badge>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="space-y-1 p-4 rounded-lg bg-secondary">
                            <p className="text-sm font-medium text-muted-foreground">Stock Physique</p>
                            <p className="text-2xl font-bold">{article.stock}</p>
                        </div>
                        <div className="space-y-1 p-4 rounded-lg bg-secondary">
                            <p className="text-sm font-medium text-muted-foreground">Stock Réservé</p>
                            <p className="text-2xl font-bold text-red-500">{stockReserver}</p>
                        </div>
                        <div className="space-y-1 p-4 rounded-lg bg-secondary">
                            <p className="text-sm font-medium text-muted-foreground">Stock Disponible</p>
                            <p className="text-2xl font-bold text-green-600">{stockDisponible}</p>
                        </div>
                         <div className="space-y-1 p-4 rounded-lg bg-secondary">
                            <p className="text-sm font-medium text-muted-foreground">Emplacement</p>
                            <p className="font-mono text-lg">{article.location || 'N/A'}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Prix Unitaire HT</p>
                            <p className="text-lg">{article.price.toFixed(2)} €</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Conditionnement</p>
                            <p className="text-lg">{article.packaging}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Code EAN</p>
                            <p className="font-mono text-lg">{article.ean || 'N/A'}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Poids</p>
                            <p className="text-lg">{article.weight ? `${article.weight} kg` : 'N/A'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historique des Mouvements</CardTitle>
                    <CardDescription>Traçabilité complète des entrées, sorties et ajustements de stock.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Stock Après Mvt.</TableHead>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Document #</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {articleMovements.length > 0 ? articleMovements.map(m => (
                                <TableRow key={m.id}>
                                <TableCell>{format(new Date(m.timestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                                <TableCell>{m.type}</TableCell>
                                <TableCell className={m.quantity > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                    {m.quantity > 0 ? `+${m.quantity}`: m.quantity}
                                </TableCell>
                                <TableCell>{m.stockAfter}</TableCell>
                                <TableCell>{m.user}</TableCell>
                                <TableCell>
                                    {m.documentId && (
                                        <Link href={`/documents/${m.documentId}`} className="underline text-blue-600">
                                            {getDocument(m.documentId)?.type.substring(0,3).toUpperCase()}-{m.documentId}
                                        </Link>
                                    )}
                                </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">Aucun mouvement pour cet article.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
