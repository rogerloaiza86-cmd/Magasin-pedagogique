
"use client";

import { useWms } from "@/context/WmsContext";
import { Article, Document, DocumentLine, Tier, ReturnReason, ReturnDecision } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Trash2, PlusCircle, RotateCcw, Download } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArticleCombobox } from "@/components/shared/ArticleCombobox";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";


type PurchaseOrderFormData = {
  supplierId: string;
  lines: {
    articleId: string;
    quantity: number;
  }[];
};

type ReceptionFormData = {
    docId: number;
    receptionNotes: string;
    lines: {
        articleId: string;
        ordered: number;
        received: number;
        nonConforming: number;
    }[];
}

type ReturnFormData = {
    clientId: string;
    lines: {
        articleId: string;
        quantity: number;
        returnReason: ReturnReason;
    }[];
}

type ProcessReturnFormData = {
    docId: number;
    lines: {
        articleId: string;
        quantity: number;
        returnReason: ReturnReason;
        returnDecision: ReturnDecision;
    }[];
}

function CreatePurchaseOrder() {
  const { state, dispatch, getArticle } = useWms();
  const { toast } = useToast();
  const { currentUser, currentEnvironmentId } = state;

  const suppliers = Array.from(state.tiers.values()).filter(
    (t) => t.type === "Fournisseur" && t.createdBy === currentUser?.username && t.environnementId === currentEnvironmentId
  );
  const articles = Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    defaultValues: { supplierId: "", lines: [{ articleId: "", quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const watchedLines = watch("lines");

  const onSubmit = (data: PurchaseOrderFormData) => {
    dispatch({
      type: "CREATE_DOCUMENT",
      payload: {
        type: "Bon de Commande Fournisseur",
        tierId: parseInt(data.supplierId, 10),
        status: "En préparation",
        lines: data.lines.map(l => ({...l, quantity: Number(l.quantity)}))
      },
    });
    toast({
      title: "Bon de Commande créé",
      description: "Le BC a été enregistré et est prêt à être réceptionné.",
    });
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Bon de Commande (BC)</CardTitle>
        <CardDescription>
          Passez une commande auprès d'un fournisseur que vous avez créé dans cet environnement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <p className="text-muted-foreground">Veuillez d'abord ajouter un fournisseur dans la section 'Gestion des Tiers'.</p>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label>Fournisseur</Label>
            <Controller
              name="supplierId"
              control={control}
              rules={{ required: "Veuillez sélectionner un fournisseur." }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un fournisseur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.supplierId && <p className="text-sm text-destructive mt-1">{errors.supplierId.message}</p>}
          </div>

          <div className="space-y-4">
            <Label>Articles</Label>
            {fields.map((field, index) => {
              const article = getArticle(watchedLines[index]?.articleId);
              return (
              <div key={field.id} className="flex items-end gap-2 p-2 border rounded-lg">
                <div className="flex-1">
                  <Controller
                    name={`lines.${index}.articleId`}
                    control={control}
                    rules={{ required: "Article requis."}}
                    render={({ field }) => (
                       <ArticleCombobox
                          articles={articles}
                          value={field.value}
                          onSelect={field.onChange}
                          placeholder="Choisir un article..."
                        />
                    )}
                  />
                  {errors.lines?.[index]?.articleId && <p className="text-sm text-destructive mt-1">{errors.lines[index]?.articleId?.message}</p>}
                </div>
                <div className="w-40">
                  <Label>Quantité</Label>
                   <Controller
                    name={`lines.${index}.quantity`}
                    control={control}
                    rules={{ required: true, min: 1 }}
                    render={({ field }) => <Input type="number" min="1" {...field} />}
                  />
                </div>
                 {article && <div className="text-sm text-muted-foreground">Stock: {article.stock}</div>}
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )})}
             <Button type="button" variant="outline" size="sm" onClick={() => append({ articleId: "", quantity: 1 })}>
                <PlusCircle className="h-4 w-4 mr-2"/>
                Ajouter une ligne
            </Button>
          </div>

          <Button type="submit">Créer le Bon de Commande</Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
}

function ReceivePurchaseOrder() {
  const { state, dispatch, getTier, getArticle } = useWms();
  const { toast } = useToast();
  const { currentUser, currentEnvironmentId } = state;
  const [selectedPO, setSelectedPO] = useState<Document | null>(null);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<ReceptionFormData>();

  const pendingPOs = Array.from(state.documents.values()).filter(
    (d) =>
      d.type === "Bon de Commande Fournisseur" && d.status === "En préparation" && d.environnementId === currentEnvironmentId
  ).filter(d => state.currentUserPermissions?.isSuperAdmin || d.createdBy === currentUser?.username);
  
  const handleOpenDialog = (doc: Document) => {
    setSelectedPO(doc);
    reset({
        docId: doc.id,
        receptionNotes: "",
        lines: doc.lines.map(line => ({
            articleId: line.articleId,
            ordered: line.quantity,
            received: line.quantity,
            nonConforming: 0,
        }))
    });
  }

  const handleCloseDialog = () => {
    setSelectedPO(null);
    reset();
  }

  const onSubmitReception = (data: ReceptionFormData) => {
    const originalDoc = state.documents.get(data.docId);
    if (!originalDoc) return;
    
    let hasAnomalies = false;
    const updatedLines: DocumentLine[] = originalDoc.lines.map((line, index) => {
        const receivedData = data.lines[index];
        const received = Number(receivedData.received);
        const nonConforming = Number(receivedData.nonConforming);
        
        if (received !== line.quantity || nonConforming > 0) {
            hasAnomalies = true;
        }

        return {
            ...line,
            quantityReceived: received,
            quantityNonConforming: nonConforming
        }
    });

    const newStatus = hasAnomalies ? 'Réceptionné avec anomalies' : 'Réceptionné';

    dispatch({
        type: 'UPDATE_DOCUMENT',
        payload: {
            ...originalDoc,
            lines: updatedLines,
            status: newStatus,
            receptionNotes: data.receptionNotes
        }
    });
    
    toast({
        title: "BC Réceptionné",
        description: `La marchandise du BC #${data.docId} a été traitée. Le stock a été mis à jour.`
    });
    
    handleCloseDialog();
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Réceptionner un Bon de Commande</CardTitle>
        <CardDescription>
          Validez la réception des marchandises, déclarez les non-conformités et mettez à jour les stocks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>BC #</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingPOs.length > 0 ? (
              pendingPOs.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.id}</TableCell>
                  <TableCell>{getTier(po.tierId)?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside">
                        {po.lines.map(line => (
                            <li key={line.articleId}>{getArticle(line.articleId)?.name} x {line.quantity}</li>
                        ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleOpenDialog(po)}>Réceptionner</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aucun bon de commande en attente de réception.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!selectedPO} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl">
            <form onSubmit={handleSubmit(onSubmitReception)}>
                <DialogHeader>
                    <DialogTitle>Réception du BC #{selectedPO?.id}</DialogTitle>
                    <DialogDescription>
                        Saisissez les quantités réellement reçues et les non-conformités.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 max-h-[50vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Article</TableHead>
                                <TableHead className="w-24">Qté Commandée</TableHead>
                                <TableHead className="w-32">Qté Reçue</TableHead>
                                <TableHead className="w-32">Qté Non-Conforme</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {watch('lines')?.map((line, index) => (
                                <TableRow key={index}>
                                    <TableCell>{getArticle(line.articleId)?.name}</TableCell>
                                    <TableCell className="text-center">{line.ordered}</TableCell>
                                    <TableCell>
                                         <Controller
                                            name={`lines.${index}.received`}
                                            control={control}
                                            rules={{ required: true, min: 0, max: line.ordered }}
                                            render={({ field }) => <Input type="number" {...field} />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <Controller
                                            name={`lines.${index}.nonConforming`}
                                            control={control}
                                            rules={{ required: true, min: 0, max: watch(`lines.${index}.received`) }}
                                            render={({ field }) => <Input type="number" {...field} />}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="receptionNotes">Réserves / Notes sur le bon de livraison</Label>
                    <Controller
                        name="receptionNotes"
                        control={control}
                        render={({ field }) => <Textarea id="receptionNotes" {...field} placeholder="Ex: Palette filmée endommagée, colis ouvert..."/>}
                    />
                </div>
                <DialogFooter className="mt-4">
                    <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                    <Button type="submit">Valider la Réception</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </>
  );
}

function CustomerReturns() {
    const { state, dispatch, getTier } = useWms();
    const { toast } = useToast();
    const { currentUser, currentEnvironmentId, documents } = state;
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isProcessDialogOpen, setIsProcessDialogOpen] = useState<Document | null>(null);
    const returnReasons: ReturnReason[] = ["Erreur de commande", "Article défectueux", "Endommagé au transport", "Autre"];
    const returnDecisions: ReturnDecision[] = ["Réintégrer en stock", "Mettre au rebut"];

    const { control: createControl, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors } } = useForm<ReturnFormData>({
        defaultValues: { clientId: "", lines: [{ articleId: "", quantity: 1, returnReason: "Autre" }] }
    });
    const { fields: createFields, append: createAppend, remove: createRemove } = useFieldArray({ control: createControl, name: "lines" });

    const { control: processControl, handleSubmit: handleProcessSubmit, reset: resetProcess, watch: watchProcess } = useForm<ProcessReturnFormData>();

    const clients = Array.from(state.tiers.values()).filter(t => t.type === 'Client' && t.environnementId === currentEnvironmentId);
    const articles = Array.from(state.articles.values()).filter(a => a.environnementId === currentEnvironmentId);
    const pendingReturns = Array.from(documents.values()).filter(d => d.type === 'Retour Client' && d.status === 'En attente de traitement' && d.environnementId === currentEnvironmentId);

    const onCreateSubmit = (data: ReturnFormData) => {
        dispatch({
            type: "CREATE_DOCUMENT",
            payload: {
                type: 'Retour Client',
                tierId: parseInt(data.clientId),
                status: 'En attente de traitement',
                lines: data.lines.map(l => ({ ...l, quantity: Number(l.quantity) })),
            }
        });
        toast({ title: "Retour enregistré", description: "Le retour client a été créé et est en attente de traitement." });
        resetCreate();
        setIsCreateDialogOpen(false);
    };
    
    const onProcessSubmit = (data: ProcessReturnFormData) => {
        const docToUpdate = documents.get(data.docId);
        if (!docToUpdate) return;
        
        dispatch({
            type: 'UPDATE_DOCUMENT',
            payload: {
                ...docToUpdate,
                status: 'Traité',
                lines: data.lines,
            }
        });

        toast({ title: "Retour traité", description: "Le stock a été mis à jour en fonction de vos décisions."});
        setIsProcessDialogOpen(null);
    };

    const openProcessDialog = (doc: Document) => {
        setIsProcessDialogOpen(doc);
        resetProcess({
            docId: doc.id,
            lines: doc.lines.map(l => ({
                articleId: l.articleId,
                quantity: l.quantity,
                returnReason: l.returnReason || "Autre",
                returnDecision: "Réintégrer en stock"
            }))
        });
    }

    return (
        <>
            <Card>
                <CardHeader className="flex-row justify-between items-center">
                    <div>
                        <CardTitle>Gestion des Retours Clients</CardTitle>
                        <CardDescription>Enregistrez et traitez les retours de marchandises.</CardDescription>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}><RotateCcw className="mr-2 h-4 w-4"/>Enregistrer un retour</Button>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Retour #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {pendingReturns.length > 0 ? (
                                pendingReturns.map(doc => (
                                    <TableRow key={doc.id}>
                                        <TableCell>{doc.id}</TableCell>
                                        <TableCell>{getTier(doc.tierId)?.name || 'N/A'}</TableCell>
                                        <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{doc.status}</TableCell>
                                        <TableCell className="text-right"><Button size="sm" onClick={() => openProcessDialog(doc)}>Traiter</Button></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun retour en attente de traitement.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Return Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
                        <DialogHeader><DialogTitle>Enregistrer un Retour Client</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                             <div>
                                <Label>Client</Label>
                                <Controller name="clientId" control={createControl} rules={{ required: true }} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Choisir un client..." /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select>
                                )}/>
                            </div>
                            <Label>Articles Retournés</Label>
                             {createFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-3 items-end gap-2 p-2 border rounded-lg">
                                    <div className="col-span-3 sm:col-span-2">
                                        <Label>Article</Label>
                                        <Controller name={`lines.${index}.articleId`} control={createControl} rules={{ required: true }} render={({ field }) => (
                                            <ArticleCombobox
                                                articles={articles}
                                                value={field.value}
                                                onSelect={field.onChange}
                                                placeholder="Choisir un article..."
                                            />
                                        )}/>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label>Quantité</Label>
                                        <Controller name={`lines.${index}.quantity`} control={createControl} rules={{ required: true, min: 1 }} render={({ field }) => <Input type="number" {...field} />} />
                                    </div>
                                    <div className="col-span-3 sm:col-span-2">
                                        <Label>Raison</Label>
                                        <Controller name={`lines.${index}.returnReason`} control={createControl} rules={{ required: true }} render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Choisir..."/></SelectTrigger><SelectContent>{returnReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                                        )}/>
                                    </div>
                                     <div className="col-span-1 flex justify-end">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => createRemove(index)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                             ))}
                              <Button type="button" variant="outline" size="sm" onClick={() => createAppend({ articleId: "", quantity: 1, returnReason: "Autre" })}>
                                <PlusCircle className="h-4 w-4 mr-2"/> Ajouter une ligne
                            </Button>
                        </div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose><Button type="submit">Enregistrer le Retour</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* Process Return Dialog */}
            <Dialog open={!!isProcessDialogOpen} onOpenChange={() => setIsProcessDialogOpen(null)}>
                 <DialogContent className="max-w-3xl">
                     <form onSubmit={handleProcessSubmit(onProcessSubmit)}>
                        <DialogHeader><DialogTitle>Traiter le Retour #{isProcessDialogOpen?.id}</DialogTitle></DialogHeader>
                        <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
                             <Table>
                                <TableHeader><TableRow><TableHead>Article</TableHead><TableHead>Qté</TableHead><TableHead>Raison</TableHead><TableHead>Décision</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {watchProcess('lines')?.map((line, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{state.articles.get(line.articleId)?.name}</TableCell>
                                            <TableCell>{line.quantity}</TableCell>
                                            <TableCell>{line.returnReason}</TableCell>
                                            <TableCell>
                                                 <Controller name={`lines.${index}.returnDecision`} control={processControl} rules={{ required: true }} render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{returnDecisions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                                                 )}/>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <DialogFooter><DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose><Button type="submit">Valider le Traitement</Button></DialogFooter>
                     </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ReturnsAnalysis() {
    const { state, getArticle } = useWms();
    const { documents, currentEnvironmentId } = state;

    const processedReturns = Array.from(documents.values()).filter(d => 
        d.type === 'Retour Client' && 
        d.status === 'Traité' &&
        d.environnementId === currentEnvironmentId
    );

    const returnReasonCounts = processedReturns.flatMap(d => d.lines).reduce((acc, line) => {
        if (line.returnReason) {
            acc[line.returnReason] = (acc[line.returnReason] || 0) + line.quantity;
        }
        return acc;
    }, {} as Record<ReturnReason, number>);
    
    const chartData = Object.entries(returnReasonCounts)
        .map(([name, total]) => ({ name, total }))
        .sort((a,b) => b.total - a.total)
        .slice(0,3);

    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID Retour,Date,Client,Article,Quantité,Raison,Décision\n";

        processedReturns.forEach(doc => {
            const clientName = state.tiers.get(doc.tierId)?.name || "N/A";
            doc.lines.forEach(line => {
                const articleName = getArticle(line.articleId)?.name || "N/A";
                const row = [
                    doc.id,
                    new Date(doc.createdAt).toLocaleDateString(),
                    `"${clientName.replace(/"/g, '""')}"`,
                    `"${articleName.replace(/"/g, '""')}"`,
                    line.quantity,
                    line.returnReason,
                    line.returnDecision
                ].join(",");
                csvContent += row + "\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "historique_retours.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Top 3 des Motifs de Retour</CardTitle>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-muted-foreground">Pas de données de retour à analyser.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex-row justify-between items-center">
                    <div>
                        <CardTitle>Historique des Retours Traités</CardTitle>
                        <CardDescription>Consultez et exportez l'historique complet des retours.</CardDescription>
                    </div>
                    <Button onClick={handleExport} variant="outline" disabled={processedReturns.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter en CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Retour #</TableHead>
                                <TableHead>Article</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Raison</TableHead>
                                <TableHead>Décision</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedReturns.length > 0 ? (
                                processedReturns.flatMap(doc => doc.lines.map((line, index) => (
                                    <TableRow key={`${doc.id}-${index}`}>
                                        <TableCell>{doc.id}</TableCell>
                                        <TableCell>{getArticle(line.articleId)?.name}</TableCell>
                                        <TableCell>{line.quantity}</TableCell>
                                        <TableCell>{line.returnReason}</TableCell>
                                        <TableCell>{line.returnDecision}</TableCell>
                                    </TableRow>
                                )))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Aucun retour traité.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export function InboundClient() {
  const { state } = useWms();
  const perms = state.currentUserPermissions;
  
  const tabs = [];
  if (perms?.canCreateBC) tabs.push({ value: "create", label: "1. Créer un BC" });
  if (perms?.canReceiveBC) {
    tabs.push({ value: "receive", label: "2. Réceptionner un BC" });
    tabs.push({ value: "returns", label: "3. Gérer un Retour Client" });
    tabs.push({ value: "analysis", label: "4. Analyse des Retours" });
  }
  
  if (tabs.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Flux Entrant</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Vous n'avez pas les permissions nécessaires pour gérer le flux entrant.</p>
            </CardContent>
        </Card>
    )
  }
  
  return (
    <Tabs defaultValue={tabs[0].value} className="w-full">
      <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
        {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
      </TabsList>
      {perms?.canCreateBC && <TabsContent value="create"><CreatePurchaseOrder /></TabsContent>}
      {perms?.canReceiveBC && <TabsContent value="receive"><ReceivePurchaseOrder /></TabsContent>}
      {perms?.canReceiveBC && <TabsContent value="returns"><CustomerReturns /></TabsContent>}
      {perms?.canReceiveBC && <TabsContent value="analysis"><ReturnsAnalysis /></TabsContent>}
    </Tabs>
  );
}
