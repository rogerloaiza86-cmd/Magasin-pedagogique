
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
import { Article } from "@/lib/types";

export function ArticlesClient() {
  const { state } = useWms();
  const { currentEnvironmentId } = state;
  const articlesInEnv = useMemo(() => 
    Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId),
    [state.articles, currentEnvironmentId]
  );
  
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = useMemo(() => {
    if (!searchTerm) {
      return articlesInEnv;
    }
    return articlesInEnv.filter(
      (article) =>
        article.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articlesInEnv, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste de tous les articles</CardTitle>
        <CardDescription>
          Consultez et recherchez parmi tous les articles disponibles dans l'environnement actuel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Rechercher par référence ou désignation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead>Adressage</TableHead>
              <TableHead>Stock Final</TableHead>
              <TableHead>Conditionnement</TableHead>
              <TableHead>Prix unitaire HT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article: Article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-mono">{article.id}</TableCell>
                  <TableCell className="font-medium">{article.name}</TableCell>
                  <TableCell className="font-mono">{article.location}</TableCell>
                  <TableCell>{article.stock}</TableCell>
                  <TableCell>{article.packaging}</TableCell>
                  <TableCell>{article.price.toFixed(2)} €</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {articlesInEnv.length === 0 ? "Aucun article dans cet environnement." : "Aucun article ne correspond à votre recherche."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
