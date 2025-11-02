
"use client";

import { useWms } from "@/context/WmsContext";
import { useState, useMemo } from "react";
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
import type { Article } from "@/lib/types";
import { Badge } from "../ui/badge";
import { PlusCircle, Download, Wand2, Loader2, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { generateFictitiousArticles } from "@/ai/flows/generate-articles-flow";


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
            packaging: "",
            ean: "",
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
                    <div>
                        <Label htmlFor="ean">Code EAN</Label>
                        <Controller name="ean" control={control} render={({field}) => <Input id="ean" {...field} />} />
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
  const { state, getArticleWithComputedStock } = useWms();
  const { currentEnvironmentId } = state;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  
  const allArticles = useMemo(() =>
    Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId),
    [state.articles, currentEnvironmentId]
  );
  
  const filteredArticles = useMemo(() =>
    allArticles.filter(article =>
      !searchTerm || article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.ean?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [allArticles, searchTerm]
  );
  
  const selectedArticle = selectedArticleId ? getArticleWithComputedStock(selectedArticleId) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulter le stock d'un article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label>Rechercher un article</Label>
             <Input
                placeholder="Entrez un nom, une référence ou un code EAN..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedArticleId("");
                }}
            />
            <Select onValueChange={setSelectedArticleId} value={selectedArticleId}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un article dans la liste filtrée..." />
                </SelectTrigger>
                <SelectContent>
                    {filteredArticles.map(article => (
                        <SelectItem key={article.id} value={article.id}>
                            {article.name} ({article.id})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {selectedArticle && (
          <Card className="mt-4 bg-secondary">
            <CardHeader>
              <CardTitle>{selectedArticle.name}</CardTitle>
              <CardDescription>Référence: {selectedArticle.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-2 border rounded-md"><Label>Stock Physique</Label><p className="font-bold text-xl">{selectedArticle.stock}</p></div>
                <div className="p-2 border rounded-md"><Label>Stock Réservé</Label><p className="font-bold text-xl text-red-500">{selectedArticle.stockReserver}</p></div>
                <div className="p-2 border rounded-md"><Label>Stock Disponible</Label><p className="font-bold text-xl text-green-600">{selectedArticle.stockDisponible}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");

  const allArticles = useMemo(() =>
    Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId),
    [state.articles, currentEnvironmentId]
  );
  
  const filteredArticles = useMemo(() =>
    allArticles.filter(article =>
        !searchTerm || article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.id.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [allArticles, searchTerm]
  );

  const movements = state.movements.filter(m => m.articleId === selectedArticleId && m.environnementId === currentEnvironmentId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulter les mouvements d'un article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label>Rechercher un article</Label>
            <Input
                placeholder="Entrez un nom ou une référence..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedArticleId("");
                }}
            />
            <Select onValueChange={setSelectedArticleId} value={selectedArticleId}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un article pour voir ses mouvements..." />
                </SelectTrigger>
                <SelectContent>
                    {filteredArticles.map(article => (
                        <SelectItem key={article.id} value={article.id}>
                            {article.name} ({article.id})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
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
    const { state, dispatch } = useWms();
    const { toast } = useToast();
    const { currentEnvironmentId } = state;
    const [searchTerm, setSearchTerm] = useState("");

    const allArticles = useMemo(() =>
        Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId),
        [state.articles, currentEnvironmentId]
    );

    const filteredArticles = useMemo(() =>
        allArticles.filter(article =>
        !searchTerm || article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.id.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [allArticles, searchTerm]
    );
    
    const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<{articleId: string, physicalStock: number | string}>({
        defaultValues: { articleId: "", physicalStock: "" }
    });
    
    const selectedArticleId = watch("articleId");
    const physicalStock = watch("physicalStock");
    const article = selectedArticleId ? state.articles.get(selectedArticleId) : null;
    
    const onSubmit = (data: {articleId: string, physicalStock: number | string}) => {
        const articleToAdjust = state.articles.get(data.articleId);
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
        <div className="space-y-2">
            <Label>Rechercher un article</Label>
            <Input
                placeholder="Entrez un nom ou une référence..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setValue("articleId", "");
                    setValue("physicalStock", "");
                }}
            />
            <Controller
                name="articleId"
                control={control}
                rules={{ required: "Veuillez sélectionner un article." }}
                render={({ field }) => (
                    <Select onValueChange={(value) => { field.onChange(value); setValue('physicalStock', ''); }} value={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un article dans la liste filtrée..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredArticles.map(article => (
                                <SelectItem key={article.id} value={article.id}>
                                    {article.name} ({article.id})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
    const { dispatch, state } = useWms();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [sector, setSector] = useState("");
    const { currentUserPermissions, currentEnvironmentId } = state;

    const sectors = [
        "Mode, Habillement et Chaussures",
        "Produits Électroniques et High-Tech",
        "Maison, Mobilier et Décoration",
        "Alimentation et Produits de Grande Consommation (PGC)",
        "Santé, Hygiène et Beauté",
        "Produits Culturels",
    ];

    const handleGenerate = async () => {
        if (!sector) {
            toast({
                variant: "destructive",
                title: "Aucun secteur sélectionné",
                description: "Veuillez choisir un secteur d'activité."
            });
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateFictitiousArticles({ sector });
            if (result.articles && result.articles.length > 0) {
                dispatch({ type: 'GENERATE_ARTICLES_BATCH', payload: { articles: result.articles } });
                toast({
                    title: "Articles générés avec succès",
                    description: `${result.articles.length} articles pour le secteur "${sector}" ont été ajoutés.`
                });
            }
        } catch (error) {
            console.error("AI data generation failed:", error);
            toast({
                variant: "destructive",
                title: "Erreur de l'IA",
                description: "La génération des articles a échoué. Veuillez réessayer."
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        dispatch({ type: 'RESET_ARTICLES', payload: { environnementId: currentEnvironmentId } });
        toast({
            variant: "destructive",
            title: "Articles réinitialisés",
            description: `Tous les articles de l'environnement actuel ont été supprimés.`
        });
    }

    if (!currentUserPermissions?.isSuperAdmin && currentUserPermissions?.profile !== 'professeur') {
        return null; // Only teachers and super admins can see this
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Génération de Données par IA</CardTitle>
                <CardDescription>
                    Générez automatiquement un jeu de 20 articles réalistes pour un secteur d'activité afin de peupler l'entrepôt pour vos scénarios.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="sector-select">Choisissez un secteur d'activité</Label>
                     <Select onValueChange={setSector} value={sector}>
                        <SelectTrigger id="sector-select">
                            <SelectValue placeholder="Sélectionner un secteur..."/>
                        </SelectTrigger>
                        <SelectContent>
                            {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
            </CardContent>
            <CardFooter className="gap-4">
                 <Button onClick={handleGenerate} disabled={isLoading || !sector}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                    Générer les 20 articles
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Réinitialiser l'environnement
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument sûr(e) ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Tous les articles de l'environnement actuel seront définitivement supprimés.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset}>Oui, réinitialiser</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
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
   if (perms.isSuperAdmin || perms.profile === 'professeur') {
    tabs.push({ value: "data", label: "Données de simulation" });
  }

  return (
    <div className="space-y-6">
        <Tabs defaultValue="view" className="w-full">
            <TabsList className="h-auto flex-wrap justify-start">
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
            {(perms.isSuperAdmin || perms.profile === 'professeur') && <TabsContent value="data"><GenerateFictitiousData /></TabsContent>}
        </Tabs>
    </div>
  );
}

    