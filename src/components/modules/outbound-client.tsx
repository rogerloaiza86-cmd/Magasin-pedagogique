
"use client";

import { useWms } from "@/context/WmsContext";
import { useState, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import { Trash2, PlusCircle } from "lucide-react";
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
import type { WmsDocument } from "@/lib/types";
import { useSearchParams } from "next/navigation";


type DeliveryNoteFormData = {
  clientId: string;
  lines: { articleId: string; quantity: number }[];
};

function CreateDeliveryNote() {
  const { state, dispatch, getArticleWithComputedStock } = useWms();
  const { toast } = useToast();
  const { currentUser, currentEnvironmentId } = state;
  const [searchTerm, setSearchTerm] = useState("");

  const clients = Array.from(state.tiers.values()).filter((t) => t.type === "Client" && t.createdBy === currentUser?.username && t.environnementId === currentEnvironmentId);
  
  const allArticles = useMemo(() => 
    Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId && a.stock > 0),
    [state.articles, currentEnvironmentId]
  );
  
  const filteredArticles = useMemo(() =>
    allArticles.filter(article =>
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.id.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [allArticles, searchTerm]
  );

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
      const article = getArticleWithComputedStock(line.articleId);
      if (article && Number(line.quantity) > article.stockDisponible) {
        setError(`lines.${index}.quantity`, {
          type: "manual",
          message: `Stock dispo. insuffisant (${article.stockDisponible} dispo.)`,
        });
        hasError = true;
      }
    });

    if (hasError) {
        toast({
            variant: "destructive",
            title: "Erreur de stock",
            description: "Impossible de créer le BL car le stock disponible est insuffisant pour un ou plusieurs articles."
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
    const article = getArticleWithComputedStock(articleId);
    if (article && Number(value) > article.stockDisponible) {
      setError(`lines.${index}.quantity`, {
        type: 'manual',
        message: `Stock dispo. insuffisant (${article.stockDisponible} dispo.)`,
      });
    } else {
      clearErrors(`lines.${index}.quantity`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Bon de Livraison (BL)</CardTitle>
        <CardDescription>Créez une commande pour un client que vous avez créé. Le stock disponible sera vérifié.</CardDescription>
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
             <Input
              placeholder="Rechercher un article par nom ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            {fields.map((field, index) => {
              const article = getArticleWithComputedStock(watchedLines[index]?.articleId);
              return (
              <div key={field.id} className="flex items-end gap-2 p-2 border rounded-lg bg-background">
                <div className="flex-1">
                  <Controller name={`lines.${index}.articleId`} control={control} rules={{ required: "Article requis."}}
                    render={({ field }) => (
                        <Select onValueChange={(value) => { field.onChange(value); clearErrors(`lines.${index}.quantity`); }} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner un article..."/></SelectTrigger>
                            <SelectContent>
                                {filteredArticles.map(a => <SelectItem key={a.id} value={a.id}>{a.name} (Stock dispo: {getArticleWithComputedStock(a.id)?.stockDisponible || 0})</SelectItem>)}
                            </SelectContent>
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
  const {currentUser, currentEnvironmentId} = state;
  const pendingDNs = Array.from(state.documents.values()).filter((d) => d.type === "Bon de Livraison Client" && d.status === "En préparation" && d.environnementId === currentEnvironmentId).filter(d => state.currentUserPermissions?.isSuperAdmin || d.createdBy === currentUser?.username);
  
  const [pickingList, setPickingList] = useState<any[] | null>(null);
  const [currentDoc, setCurrentDoc] = useState<WmsDocument | null>(null);

  const handleGeneratePickingList = async (doc: WmsDocument) => {
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

    const standardList = itemsToPick.map(item => ({
        ...getArticle(item.ID_Article)!,
        stock: item.Quantite // Using stock field to show quantity to pick
      })).sort((a,b) => a.location.localeCompare(b.location));

    setPickingList(standardList);
  }

  const handlePreparationFinished = () => {
    if (currentDoc) {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { ...currentDoc, status: 'Prêt pour expédition' } });
        setPickingList(null);
        setCurrentDoc(null);
        toast({
            title: "Préparation terminée",
            description: `La commande #${currentDoc.id} est prête à être expédiée.`,
        });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Préparer une Commande (Picking)</CardTitle>
          <CardDescription>Générez un bon de préparation pour un BL.</CardDescription>
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
                      <Button onClick={() => handleGeneratePickingList(dn)}>
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
            <DialogTitle>Bon de Préparation pour BL #{currentDoc?.id}</DialogTitle>
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
                <AlertDialogDescription>Confirmer la fin de la préparation pour le BL #{currentDoc?.id}. Le statut passera à "Prêt pour expédition".</AlertDialogDescription>
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
    const {currentUser, currentEnvironmentId, users, roles} = state;
    const transporters = Array.from(state.tiers.values()).filter(t => t.type === 'Transporteur' && t.environnementId === currentEnvironmentId).filter(d => state.currentUserPermissions?.isSuperAdmin || d.createdBy === currentUser?.username);
    const shippableDNs = Array.from(state.documents.values()).filter((d) => d.type === "Bon de Livraison Client" && d.status === "Prêt pour expédition" && d.environnementId === currentEnvironmentId).filter(d => state.currentUserPermissions?.isSuperAdmin || d.createdBy === currentUser?.username);

    const [selectedTransporter, setSelectedTransporter] = useState<string>("");
    const [finalDoc, setFinalDoc] = useState<{bl: WmsDocument, cmr: WmsDocument} | null>(null);

    const getCreatorSignature = (username: string) => {
        const user = users.get(username);
        if (!user) return username;
        const roleName = roles.get(user.roleId)?.name || user.profile;
        return `${user.username} (${roleName})`;
    }

    const handleShip = (doc: WmsDocument) => {
        if (!selectedTransporter) {
            toast({ variant: "destructive", title: "Transporteur manquant", description: "Veuillez sélectionner un transporteur."});
            return;
        }

        const transporterId = parseInt(selectedTransporter, 10);
        
        // This will trigger stock deduction and status update in the reducer
        dispatch({ type: 'UPDATE_DOCUMENT', payload: {...doc, status: 'Expédié'} });

        const newDocIdBeforeCreation = state.docIdCounter;

        // Create CMR document
        dispatch({
            type: 'CREATE_DOCUMENT', 
            payload: {
                type: 'Lettre de Voiture',
                tierId: doc.tierId,
                status: 'Validé',
                lines: doc.lines,
                transporterId: transporterId,
            }
        });
        
        const cmrPreview: WmsDocument = {
            id: newDocIdBeforeCreation,
            type: 'Lettre de Voiture',
            tierId: doc.tierId,
            status: 'Validé',
            lines: doc.lines,
            transporterId: transporterId,
            createdBy: currentUser?.username || 'unknown',
            createdAt: new Date().toISOString(),
            environnementId: currentEnvironmentId
        };
        
        setFinalDoc({ bl: {...doc, status: 'Expédié'}, cmr: cmrPreview});
        setSelectedTransporter("");

        toast({ title: "Commande Expédiée", description: `Le BL #${doc.id} a été expédié et la Lettre de Voiture a été générée.`});
    };

    return (
        <>
        <Card>
            <CardHeader><CardTitle>Expédier une Commande et Générer Documents</CardTitle><CardDescription>Finalisez l'expédition et générez le BL final et la Lettre de Voiture (CMR).</CardDescription></CardHeader>
            <CardContent>
            {transporters.length === 0 ? (<p className="text-muted-foreground">Veuillez d'abord ajouter un transporteur que vous avez créé.</p>) : (
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
                             <p className="text-sm text-muted-foreground mt-2">Créé par: {getCreatorSignature(finalDoc?.bl.createdBy || '')}</p>
                            <h4 className="font-bold mt-4">Articles:</h4>
                            <ul>{finalDoc?.bl.lines.map(l => <li key={l.articleId}>{getArticle(l.articleId)?.name} x {l.quantity}</li>)}</ul>
                        </CardContent>
                    </Card>
                    {/* CMR */}
                    <Card>
                        <CardHeader><CardTitle>Lettre de Voiture (CMR) #{finalDoc?.cmr.id}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <p><strong>Expéditeur:</strong> Lycée Gaspard Monge</p>
                             <p><strong>Destinataire:</strong> {getTier(finalDoc?.cmr.tierId || 0)?.name} - {getTier(finalDoc?.cmr.tierId || 0)?.address}</p>
                             <p><strong>Transporteur:</strong> {getTier(finalDoc?.cmr.transporterId || 0)?.name}</p>
                             <p className="text-sm text-muted-foreground">Créé par: {getCreatorSignature(finalDoc?.cmr.createdBy || '')}</p>
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
  const { state } = useWms();
  const perms = state.currentUserPermissions;
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const tabs = [];
  if (perms?.canCreateBL) tabs.push({ value: "create", label: "1. Créer un BL" });
  if (perms?.canPrepareBL) tabs.push({ value: "prepare", label: "2. Préparer (Picking)" });
  if (perms?.canShipBL) tabs.push({ value: "ship", label: "3. Expédier & Générer Docs" });

  if (tabs.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Flux Sortant</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Vous n'avez pas les permissions nécessaires pour gérer le flux sortant.</p>
            </CardContent>
        </Card>
    )
  }

  const defaultTab = tabParam && tabs.some(t => t.value === tabParam) ? tabParam : tabs[0].value;

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
        {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
      </TabsList>
      {perms?.canCreateBL && <TabsContent value="create"><CreateDeliveryNote /></TabsContent>}
      {perms?.canPrepareBL && <TabsContent value="prepare"><PrepareOrder /></TabsContent>}
      {perms?.canShipBL && <TabsContent value="ship"><ShipOrder /></TabsContent>}
    </Tabs>
  );
}
