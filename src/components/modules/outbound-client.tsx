"use client";

import { useWms } from "@/context/WmsContext";
import { optimizePickingRoute } from "@/ai/flows/optimize-picking-route";
import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, Loader2, FileText, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Article, Document as WmsDocument } from "@/lib/types";

type DeliveryNoteFormData = {
  clientId: string;
  lines: { articleId: string; quantity: number }[];
};

function CreateDeliveryNote() {
  const { state, dispatch, getArticle } = useWms();
  const { toast } = useToast();
  const clients = Array.from(state.tiers.values()).filter((t) => t.type === "Client");
  const articles = Array.from(state.articles.values());

  const { control, handleSubmit, reset, watch, setError, clearErrors, formState: { errors } } =
    useForm<DeliveryNoteFormData>({
      defaultValues: { clientId: "", lines: [{ articleId: "", quantity: 1 }] },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const watchedLines = watch("lines");

  const onSubmit = (data: DeliveryNoteFormData) => {
    // Final stock check before submission
    let hasError = false;
    data.lines.forEach((line, index) => {
      const article = getArticle(line.articleId);
      if (article && Number(line.quantity) > article.stock) {
        setError(`lines.${index}.quantity`, {
          type: "manual",
          message: `Stock insuffisant (${article.stock} dispo.)`,
        });
        hasError = true;
      }
    });

    if (hasError) {
        toast({
            variant: "destructive",
            title: "Erreur de stock",
            description: "Impossible de créer le BL car le stock est insuffisant pour un ou plusieurs articles."
        })
        return;
    }

    dispatch({
      type: "CREATE_DOCUMENT",
      payload: {
        type: "Bon de Livraison Client",
        tierId: parseInt(data.clientId, 10),
        status: "En préparation",
        lines: data.lines.map(l => ({...l, quantity: Number(l.quantity)})),
      },
    });
    toast({
      title: "Bon de Livraison créé",
      description: "Le BL a été enregistré et est prêt à être préparé.",
    });
    reset();
  };

  const handleQuantityChange = (index: number, value: string) => {
    const articleId = watchedLines[index]?.articleId;
    if (!articleId) return;
    const article = getArticle(articleId);
    if (article && Number(value) > article.stock) {
      setError(`lines.${index}.quantity`, {
        type: 'manual',
        message: `Stock insuffisant (${article.stock} dispo.)`,
      });
    } else {
      clearErrors(`lines.${index}.quantity`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Bon de Livraison (BL)</CardTitle>
        <CardDescription>Créez une commande pour un client. Le stock sera vérifié.</CardDescription>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
            <p className="text-muted-foreground">Veuillez d'abord ajouter un client dans la section 'Gestion des Tiers'.</p>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label>Client</Label>
            <Controller
              name="clientId"
              control={control}
              rules={{ required: "Veuillez sélectionner un client." }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Choisir un client..." /></SelectTrigger>
                  <SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
                </Select>
              )}
            />
             {errors.clientId && <p className="text-sm text-destructive mt-1">{errors.clientId.message}</p>}
          </div>

          <div className="space-y-4">
            <Label>Articles</Label>
            {fields.map((field, index) => {
              const article = getArticle(watchedLines[index]?.articleId);
              return (
              <div key={field.id} className="flex items-end gap-2 p-2 border rounded-lg bg-background">
                <div className="flex-1">
                  <Controller name={`lines.${index}.articleId`} control={control} rules={{ required: "Article requis."}}
                    render={({ field }) => (
                      <Select onValueChange={(value) => { field.onChange(value); clearErrors(`lines.${index}.quantity`); }} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Choisir un article..." /></SelectTrigger>
                        <SelectContent>{articles.map((a) => (<SelectItem key={a.id} value={a.id} disabled={a.stock === 0}>{a.name} ({a.id}) - Stock: {a.stock}</SelectItem>))}</SelectContent>
                      </Select>
                    )}
                  />
                  {errors.lines?.[index]?.articleId && <p className="text-sm text-destructive mt-1">{errors.lines[index]?.articleId?.message}</p>}
                </div>
                <div className="w-40">
                  <Label>Quantité</Label>
                   <Controller name={`lines.${index}.quantity`} control={control} rules={{ required: true, min: 1 }}
                    render={({ field }) => (
                      <Input type="number" min="1" {...field} onChange={(e) => {
                        field.onChange(e);
                        handleQuantityChange(index, e.target.value);
                      }}/>
                    )}
                  />
                  {errors.lines?.[index]?.quantity && <p className="text-sm text-destructive mt-1">{errors.lines[index]?.quantity?.message}</p>}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )})}
             <Button type="button" variant="outline" size="sm" onClick={() => append({ articleId: "", quantity: 1 })}>
                <PlusCircle className="h-4 w-4 mr-2"/> Ajouter une ligne
            </Button>
          </div>
          <Button type="submit">Créer le Bon de Livraison</Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
}

function PrepareOrder() {
  const { state, dispatch, getTier, getArticle } = useWms();
  const { toast } = useToast();
  const pendingDNs = Array.from(state.documents.values()).filter((d) => d.type === "Bon de Livraison Client" && d.status === "En préparation");
  
  const [isLoading, setIsLoading] = useState(false);
  const [pickingList, setPickingList] = useState<Article[] | null>(null);
  const [currentDoc, setCurrentDoc] = useState<WmsDocument | null>(null);

  const handleGeneratePickingList = async (doc: WmsDocument) => {
    setIsLoading(true);
    setCurrentDoc(doc);
    const itemsToPick = doc.lines.map(line => {
        const article = getArticle(line.articleId);
        return {
            ID_Article: article?.id || 'N/A',
            Designation: article?.name || 'N/A',
            Emplacement: article?.location || 'N/A',
            Quantite: line.quantity
        }
    });

    try {
      const result = await optimizePickingRoute({ items: itemsToPick });
      const optimizedArticles = result.optimizedRoute.map(item => ({
        ...getArticle(item.ID_Article)!,
        stock: item.Quantite // Using stock field to show quantity to pick
      }));
      setPickingList(optimizedArticles);
    } catch(error) {
        console.error("AI Error:", error);
        toast({
            variant: "destructive",
            title: "Erreur IA",
            description: "La génération de la liste de picking optimisée a échoué. Utilisation d'une liste standard."
        });
        const standardList = doc.lines.map(line => ({
          ...getArticle(line.articleId)!,
          stock: line.quantity
        })).sort((a,b) => a.location.localeCompare(b.location));
        setPickingList(standardList);
    } finally {
        setIsLoading(false);
    }
  }

  const handlePreparationFinished = () => {
    if (currentDoc) {
        // Here we would trigger the shipment flow
        setPickingList(null);
        setCurrentDoc(null);
        toast({
            title: "Préparation terminée",
            description: `La commande #${currentDoc.id} est prête à être expédiée.`,
        });
        // The next logical step is shipping, so let's leave it in this state.
        // The user should now go to the "Expédier" tab.
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Préparer une Commande (Picking)</CardTitle>
          <CardDescription>Générez un bon de préparation optimisé pour un BL.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>BL #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {pendingDNs.length > 0 ? (
                pendingDNs.map((dn) => (
                  <TableRow key={dn.id}>
                    <TableCell className="font-medium">{dn.id}</TableCell>
                    <TableCell>{getTier(dn.tierId)?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(dn.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleGeneratePickingList(dn)} disabled={isLoading}>
                        {isLoading && currentDoc?.id === dn.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                        Générer Bon de Préparation
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucun bon de livraison à préparer.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!pickingList} onOpenChange={() => { setPickingList(null); setCurrentDoc(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bon de Préparation Optimisé pour BL #{currentDoc?.id}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Emplacement</TableHead><TableHead>Article</TableHead><TableHead>Quantité à prélever</TableHead></TableRow></TableHeader>
            <TableBody>
                {pickingList?.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-mono font-bold">{item.location}</TableCell>
                        <TableCell>{item.name} ({item.id})</TableCell>
                        <TableCell className="font-bold">{item.stock}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full mt-4">Préparation Terminée</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>La préparation est-elle terminée ?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogDescription>Confirmer la fin de la préparation pour le BL #{currentDoc?.id}.</AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel>Non</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePreparationFinished}>Oui, terminée</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShipOrder() {
    const { state, dispatch, getTier, getArticle } = useWms();
    const { toast } = useToast();
    const transporters = Array.from(state.tiers.values()).filter(t => t.type === 'Transporteur');
    // For shipping, we consider orders that are "En préparation" as ready, assuming picking is a sub-step.
    const shippableDNs = Array.from(state.documents.values()).filter((d) => d.type === "Bon de Livraison Client" && d.status === "En préparation");

    const [selectedTransporter, setSelectedTransporter] = useState<string>("");
    const [finalDoc, setFinalDoc] = useState<{bl: WmsDocument, cmr: WmsDocument} | null>(null);

    const handleShip = (doc: WmsDocument) => {
        if (!selectedTransporter) {
            toast({ variant: "destructive", title: "Transporteur manquant", description: "Veuillez sélectionner un transporteur."});
            return;
        }

        const transporterId = parseInt(selectedTransporter, 10);
        
        // Update BL status to 'Expédié'
        dispatch({ type: 'UPDATE_DOCUMENT', payload: {...doc, status: 'Expédié'} });

        // Create CMR document
        const cmr: Omit<WmsDocument, 'id' | 'createdAt'> = {
            type: 'Lettre de Voiture',
            tierId: doc.tierId,
            status: 'Validé',
            lines: doc.lines,
            transporterId: transporterId,
        };
        dispatch({type: 'CREATE_DOCUMENT', payload: cmr});

        const newDocId = state.docIdCounter;
        setFinalDoc({ bl: {...doc, status: 'Expédié'}, cmr: {...cmr, id: newDocId, createdAt: new Date().toISOString()}});

        toast({ title: "Commande Expédiée", description: `Le BL #${doc.id} a été expédié et la Lettre de Voiture a été générée.`});
    };

    return (
        <>
        <Card>
            <CardHeader><CardTitle>Expédier une Commande et Générer Documents</CardTitle><CardDescription>Finalisez l'expédition et générez le BL final et la Lettre de Voiture (CMR).</CardDescription></CardHeader>
            <CardContent>
            {transporters.length === 0 ? (<p className="text-muted-foreground">Veuillez d'abord ajouter un transporteur.</p>) : (
                <div className="space-y-4">
                    <div>
                        <Label>Transporteur</Label>
                        <Select onValueChange={setSelectedTransporter} value={selectedTransporter}>
                            <SelectTrigger><SelectValue placeholder="Choisir un transporteur..." /></SelectTrigger>
                            <SelectContent>{transporters.map((t) => (<SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>BL #</TableHead><TableHead>Client</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {shippableDNs.length > 0 ? (
                            shippableDNs.map((dn) => (
                            <TableRow key={dn.id}>
                                <TableCell className="font-medium">{dn.id}</TableCell>
                                <TableCell>{getTier(dn.tierId)?.name || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                <Button onClick={() => handleShip(dn)} disabled={!selectedTransporter}>Expédier</Button>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">Aucune commande prête à être expédiée.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            )}
            </CardContent>
        </Card>
        <Dialog open={!!finalDoc} onOpenChange={() => setFinalDoc(null)}>
            <DialogContent className="max-w-4xl">
                <DialogHeader><DialogTitle>Documents d'Expédition</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
                    {/* Final BL */}
                    <Card>
                        <CardHeader><CardTitle>Bon de Livraison #{finalDoc?.bl.id}</CardTitle></CardHeader>
                        <CardContent>
                            <p><strong>Client:</strong> {getTier(finalDoc?.bl.tierId || 0)?.name}</p>
                            <p><strong>Adresse:</strong> {getTier(finalDoc?.bl.tierId || 0)?.address}</p>
                            <p><strong>Statut:</strong> <span className="font-bold text-green-600">{finalDoc?.bl.status}</span></p>
                            <h4 className="font-bold mt-4">Articles:</h4>
                            <ul>{finalDoc?.bl.lines.map(l => <li key={l.articleId}>{getArticle(l.articleId)?.name} x {l.quantity}</li>)}</ul>
                        </CardContent>
                    </Card>
                    {/* CMR */}
                    <Card>
                        <CardHeader><CardTitle>Lettre de Voiture (CMR) #{finalDoc?.cmr.id}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <p><strong>Expéditeur:</strong> Lycée LogiSim</p>
                             <p><strong>Destinataire:</strong> {getTier(finalDoc?.cmr.tierId || 0)?.name} - {getTier(finalDoc?.cmr.tierId || 0)?.address}</p>
                             <p><strong>Transporteur:</strong> {getTier(finalDoc?.cmr.transporterId || 0)?.name}</p>
                             <h4 className="font-bold mt-4">Marchandise:</h4>
                             <ul>{finalDoc?.cmr.lines.map(l => <li key={l.articleId}>{getArticle(l.articleId)?.name} ({getArticle(l.articleId)?.packaging}) x {l.quantity}</li>)}</ul>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}

export function OutboundClient() {
  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="create">1. Créer un BL</TabsTrigger>
        <TabsTrigger value="prepare">2. Préparer (Picking)</TabsTrigger>
        <TabsTrigger value="ship">3. Expédier & Générer Docs</TabsTrigger>
      </TabsList>
      <TabsContent value="create"><CreateDeliveryNote /></TabsContent>
      <TabsContent value="prepare"><PrepareOrder /></TabsContent>
      <TabsContent value="ship"><ShipOrder /></TabsContent>
    </Tabs>
  );
}
