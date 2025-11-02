
"use client";

import { useWms } from "@/context/WmsContext";
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Article, ArticleStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Barcode } from "lucide-react";
import Link from "next/link";

export function ArticlesClient() {
  const { state, getArticleWithComputedStock } = useWms();
  const { currentEnvironmentId } = state;
  const articlesInEnv = useMemo(() => 
    Array.from(state.articles.values())
      .filter(a => a.environnementId === currentEnvironmentId)
      .map(a => getArticleWithComputedStock(a.id))
      .filter(Boolean) as (Article & { stockReserver: number; stockDisponible: number; })[],
    [state.articles, currentEnvironmentId, getArticleWithComputedStock]
  );
  
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = useMemo(() => {
    if (!searchTerm) {
      return articlesInEnv;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return articlesInEnv.filter(
      (article) =>
        article.id.toLowerCase().includes(lowercasedTerm) ||
        article.name.toLowerCase().includes(lowercasedTerm) ||
        article.ean?.includes(lowercasedTerm)
    );
  }, [articlesInEnv, searchTerm]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste de tous les articles</CardTitle>
        <CardDescription>
          Consultez et recherchez parmi tous les articles disponibles dans l'environnement actuel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative max-w-sm">
          <Input
            placeholder="Rechercher par réf, désignation, EAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Stock Physique</TableHead>
                <TableHead>Stock Disponible</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead className="text-right">Détails</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                    <TableCell className="font-mono">{article.id}</TableCell>
                    <TableCell className="font-medium">{article.name}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(article.status)}>{article.status}</Badge></TableCell>
                    <TableCell className="font-bold">{article.stock}</TableCell>
                    <TableCell>{article.stockDisponible}</TableCell>
                    <TableCell className="font-mono">{article.location}</TableCell>
                    <TableCell className="text-right">
                        <Link href={`/articles/${article.id}`}>
                            <Button variant="ghost" size="icon">
                               <Eye className="h-4 w-4"/>
                            </Button>
                        </Link>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                    {articlesInEnv.length === 0 ? "Aucun article dans cet environnement." : "Aucun article ne correspond à votre recherche."}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
