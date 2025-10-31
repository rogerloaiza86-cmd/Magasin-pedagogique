
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Article, Movement } from "@/lib/types";
import { Badge } from "../ui/badge";
import { PlusCircle, Download } from "lucide-react";
import { faker } from "@faker-js/faker/locale/fr";
import { ArticleCombobox } from "../shared/ArticleCombobox";

function CreateArticleForm() {
    const { dispatch } = useWms();
    const { toast } = useToast();
    const { control, handleSubmit, reset, formState: { errors } } = useForm<Omit<Article, 'environnementId' | 'status'>>({
        defaultValues: {
            id: "",
            name: "",
            location: "",
            stock: 0,
            price: 0,
            packaging: ""
        }
    });

    const onSubmit = (data: Omit<Article, 'environnementId' | 'status'>) => {
        dispatch({ type: 'ADD_ARTICLE', payload: data });
        toast({
            title: "Article Créé",
            description: `L'article "${data.name}" a été ajouté avec un stock initial de ${data.stock}.`
        });
        reset();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Créer un nouvel article</CardTitle>
                <CardDescription>Remplissez le formulaire pour ajouter un nouvel article au catalogue de cet environnement.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="id">Référence</Label>
                            <Controller name="id" control={control} rules={{ required: "La référence est requise."}} render={({field}) => <Input id="id" {...field} />} />
                            {errors.id && <p className="text-sm text-destructive mt-1">{errors.id.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="name">Désignation</Label>
                            <Controller name="name" control={control} rules={{ required: "La désignation est requise."}} render={({field}) => <Input id="name" {...field} />} />
                             {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">Emplacement</Label>
                            <Controller name="location" control={control} rules={{ required: "L'emplacement est requis."}} render={({field}) => <Input id="location" placeholder="Ex: A.1.1.A" {...field} />} />
                             {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="packaging">Conditionnement</Label>
                            <Controller name="packaging" control={control} rules={{ required: "Le conditionnement est requis."}} render={({field}) => <Input id="packaging" placeholder="Ex: PIEC, BOTE,..." {...field} />} />
                             {errors.packaging && <p className="text-sm text-destructive mt-1">{errors.packaging.message}</p>}
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="stock">Stock Initial</Label>
                            <Controller name="stock" control={control} rules={{ required: "Stock requis.", min: 0, valueAsNumber: true }} render={({field}) => <Input id="stock" type="number" {...field} />} />
                        </div>
                         <div>
                            <Label htmlFor="price">Prix Unitaire HT</Label>
                            <Controller name="price" control={control} rules={{ required: "Prix requis.", min: 0, valueAsNumber: true }} render={({field}) => <Input id="price" type="number" step="0.01" {...field} />} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit"><PlusCircle className="mr-2 h-4 w-4"/>Créer l'article</Button>
                </CardFooter>
            </form>
        </Card>
    )
}

function ViewStock() {
  const { state, getArticle } = useWms();
  const { currentEnvironmentId } = state;
  const articlesInEnv = Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId);
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
                <ArticleCombobox
                    articles={articlesInEnv}
                    value={selectedArticleId}
                    onChange={setSelectedArticleId}
                />
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
  const { currentEnvironmentId } = state;
  const articlesInEnv = Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const movements = state.movements.filter(m => m.articleId === selectedArticleId && m.environnementId === currentEnvironmentId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulter les mouvements d'un article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
            <div className="flex-grow">
                 <Label>Article</Label>
                 <ArticleCombobox
                    articles={articlesInEnv}
                    value={selectedArticleId}
                    onChange={setSelectedArticleId}
                 />
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
    const { currentEnvironmentId } = state;
    const articlesInEnv = Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId);
    const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<{articleId: string, physicalStock: number | string}>({
        defaultValues: { articleId: "", physicalStock: "" }
    });
    const selectedArticleId = watch("articleId");
    const physicalStock = watch("physicalStock");
    const article = selectedArticleId ? getArticle(selectedArticleId) : null;
    
    const onSubmit = (data: {articleId: string, physicalStock: number | string}) => {
        const articleToAdjust = getArticle(data.articleId);
        if (articleToAdjust) {
            const countedStock = Number(data.physicalStock);
            if (isNaN(countedStock)) {
                toast({
                    variant: "destructive",
                    title: "Erreur de saisie",
                    description: "La quantité physique doit être un nombre."
                });
                return;
            }

            dispatch({
                type: 'ADJUST_INVENTORY',
                payload: {
                    articleId: data.articleId,
                    newStock: countedStock,
                    oldStock: articleToAdjust.stock
                }
            });
            toast({
                title: "Inventaire ajusté",
                description: `Le stock de ${articleToAdjust.name} est passé de ${articleToAdjust.stock} à ${countedStock}.`
            })
            reset();
        }
    }
    
    const stockDifference = article ? Number(physicalStock) - article.stock : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effectuer un inventaire tournant</CardTitle>
        <CardDescription>Corrigez le stock d'un article après un comptage physique et visualisez l'écart.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4">
        <div className="flex-grow">
            <Label>Article</Label>
            <Controller
                name="articleId"
                control={control}
                rules={{ required: "Veuillez sélectionner un article." }}
                render={({ field }) => (
                    <ArticleCombobox
                        articles={articlesInEnv}
                        value={field.value}
                        onChange={(value) => { field.onChange(value); setValue('physicalStock', ''); }}
                    />
                )}
            />
            {errors.articleId && <p className="text-sm text-destructive mt-1">{errors.articleId.message}</p>}
        </div>
        {article && (
            <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="p-4 border rounded-md">
                    <Label>Stock théorique</Label>
                    <p className="font-bold text-2xl">{article.stock}</p>
                </div>
                <div className="p-4 border rounded-md">
                    <Label htmlFor="physicalStock">Stock physique compté</Label>
                    <Controller
                        name="physicalStock"
                        control={control}
                        rules={{ required: "Quantité requise", min: { value: 0, message: "Ne peut être négatif" } }}
                        render={({ field }) => <Input type="number" id="physicalStock" className="text-2xl h-auto p-0 border-0 focus-visible:ring-0" {...field} />}
                    />
                    {errors.physicalStock && <p className="text-sm text-destructive mt-1">{errors.physicalStock.message}</p>}
                </div>
                 <div className="p-4 border rounded-md">
                    <Label>Écart d'inventaire</Label>
                    <p className={`font-bold text-2xl ${stockDifference === 0 ? '' : stockDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {physicalStock === '' ? '-' : (stockDifference > 0 ? `+${stockDifference}` : stockDifference)}
                    </p>
                </div>
            </div>
        )}
      </CardContent>
      {article && <CardFooter><Button type="submit" disabled={physicalStock === ''}>Valider et Ajuster le stock</Button></CardFooter>}
      </form>
    </Card>
  );
}

function GenerateFictitiousData() {
    const { toast } = useToast();

    const generateAndDownloadCsv = () => {
        const headers = ["id", "name", "location", "stock", "price", "packaging", "status"];
        let csvContent = headers.join(",") + "\n";

        for (let i = 0; i < 50; i++) {
            const row = [
                `SKU-FICTIF-${faker.string.alphanumeric(6).toUpperCase()}`,
                `"${faker.commerce.productName().replace(/"/g, '""')}"`,
                `${faker.string.alpha(1).toUpperCase()}.${faker.number.int({min:1, max:10})}.${faker.number.int({min:1, max:6})}.${faker.string.alpha(1).toUpperCase()}`,
                faker.number.int({ min: 10, max: 2000 }),
                parseFloat(faker.commerce.price()),
                "PIEC",
                "Actif"
            ];
            csvContent += row.join(",") + "\n";
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "stock-fictif.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        toast({
            title: "Téléchargement lancé",
            description: "Le fichier stock-fictif.csv a été généré."
        })
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Génération de Données Fictives</CardTitle>
                <CardDescription>
                    Créez un fichier CSV avec 50 articles fictifs que vous pourrez ensuite importer ou utiliser
                    pour vos scénarios dans cet entrepôt de simulation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={generateAndDownloadCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    Générer et Télécharger le CSV
                </Button>
            </CardContent>
        </Card>
    )
}


export function StockClient() {
  const { state } = useWms();
  const perms = state.currentUserPermissions;
  const { currentEnvironmentId } = state;

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
  if(perms.canManageStock) {
    tabs.push({ value: "create", label: "Créer un Article" });
    tabs.push({ value: "adjust", label: "Inventaire / Ajustement" });
  }

  return (
    <div className="space-y-6">
        {currentEnvironmentId === 'entrepot_fictif_ecommerce' && <GenerateFictitiousData />}

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
        {perms.canManageStock && <TabsContent value="create"><CreateArticleForm /></TabsContent>}
        {perms.canManageStock && <TabsContent value="adjust"><AdjustInventory /></TabsContent>}
        </Tabs>
    </div>
  );
}

    
