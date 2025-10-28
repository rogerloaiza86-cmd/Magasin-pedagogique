"use client";

import { useWms } from "@/context/WmsContext";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Article, Movement } from "@/lib/types";

function ViewStock() {
  const { state, getArticle } = useWms();
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const selectedArticle = selectedArticleId ? getArticle(selectedArticleId) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulter le stock d'un article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
            <div className="flex-grow">
                <Label>Article</Label>
                <Select onValueChange={setSelectedArticleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un article..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(state.articles.values()).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
        </div>

        {selectedArticle && (
          <Card className="mt-4 bg-secondary">
            <CardHeader>
              <CardTitle>{selectedArticle.name}</CardTitle>
              <CardDescription>Référence: {selectedArticle.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold">Stock Actuel:</span> <span className="text-2xl font-bold">{selectedArticle.stock}</span></div>
                <div><span className="font-semibold">Emplacement:</span> <span className="font-mono">{selectedArticle.location}</span></div>
                <div><span className="font-semibold">Prix HT:</span> {selectedArticle.price.toFixed(2)} €</div>
                <div><span className="font-semibold">Conditionnement:</span> {selectedArticle.packaging}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

function ViewMovements() {
  const { state } = useWms();
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const movements = state.movements.filter(m => m.articleId === selectedArticleId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulter les mouvements d'un article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
            <div className="flex-grow">
                 <Label>Article</Label>
                <Select onValueChange={setSelectedArticleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un article..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(state.articles.values()).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
        </div>

        {selectedArticleId && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Stock Après Mvt.</TableHead>
                <TableHead>Utilisateur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length > 0 ? movements.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{m.type}</TableCell>
                  <TableCell className={m.quantity > 0 ? "text-green-600" : "text-red-600"}>
                    {m.quantity > 0 ? `+${m.quantity}`: m.quantity}
                  </TableCell>
                  <TableCell>{m.stockAfter}</TableCell>
                  <TableCell>{m.user}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun mouvement pour cet article.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AdjustInventory() {
    const { state, dispatch, getArticle } = useWms();
    const { toast } = useToast();
    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<{articleId: string, physicalStock: number}>({
        defaultValues: { articleId: "", physicalStock: 0 }
    });
    const selectedArticleId = watch("articleId");
    const article = selectedArticleId ? getArticle(selectedArticleId) : null;
    
    const onSubmit = (data: {articleId: string, physicalStock: number}) => {
        const articleToAdjust = getArticle(data.articleId);
        if (articleToAdjust) {
            const physicalStock = Number(data.physicalStock);
            dispatch({
                type: 'ADJUST_INVENTORY',
                payload: {
                    articleId: data.articleId,
                    newStock: physicalStock,
                    oldStock: articleToAdjust.stock
                }
            });
            toast({
                title: "Inventaire ajusté",
                description: `Le stock de ${articleToAdjust.name} est passé à ${physicalStock}.`
            })
        }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effectuer un ajustement d'inventaire</CardTitle>
        <CardDescription>Corrigez le stock d'un article après un comptage physique.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4">
        <div className="flex-grow">
            <Label>Article</Label>
            <Controller
                name="articleId"
                control={control}
                rules={{ required: "Article requis" }}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un article..." /></SelectTrigger>
                        <SelectContent>{Array.from(state.articles.values()).map((a) => (<SelectItem key={a.id} value={a.id}>{a.name} ({a.id})</SelectItem>))}</SelectContent>
                    </Select>
                )}
            />
        </div>
        {article && (
            <div className="space-y-4">
                <p>Stock théorique (actuel): <span className="font-bold text-lg">{article.stock}</span></p>
                <div>
                    <Label htmlFor="physicalStock">Stock physique réel compté</Label>
                    <Controller
                        name="physicalStock"
                        control={control}
                        rules={{ required: true, min: 0 }}
                        render={({ field }) => <Input type="number" {...field} />}
                    />
                    {errors.physicalStock && <p className="text-sm text-destructive mt-1">Veuillez entrer une valeur valide.</p>}
                </div>
            </div>
        )}
      </CardContent>
      {article && <CardFooter><Button type="submit">Ajuster le stock</Button></CardFooter>}
      </form>
    </Card>
  );
}

export function StockClient() {
  const { state } = useWms();
  const perms = state.currentUserPermissions;

  if (!perms?.canViewStock) {
    return (
        <Card>
            <CardHeader><CardTitle>Gestion des Stocks</CardTitle></CardHeader>
            <CardContent><p>Vous n'avez pas les permissions nécessaires pour voir cette page.</p></CardContent>
        </Card>
    )
  }

  const tabs = [];
  tabs.push({ value: "view", label: "Consulter le Stock" });
  tabs.push({ value: "movements", label: "Consulter les Mouvements" });
  if(perms.canManageStock) tabs.push({ value: "adjust", label: "Ajustement d'Inventaire" });

  return (
    <Tabs defaultValue="view" className="w-full">
      <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
        {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
      </TabsList>
      <TabsContent value="view">
        <ViewStock />
      </TabsContent>
      <TabsContent value="movements">
        <ViewMovements />
      </TabsContent>
      {perms.canManageStock && <TabsContent value="adjust"><AdjustInventory /></TabsContent>}
    </Tabs>
  );
}
