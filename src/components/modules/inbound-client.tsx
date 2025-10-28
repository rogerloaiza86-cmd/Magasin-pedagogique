"use client";

import { useWms } from "@/context/WmsContext";
import { Article, DocumentLine, Tier } from "@/lib/types";
import { useState } from "react";
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

type PurchaseOrderFormData = {
  supplierId: string;
  lines: {
    articleId: string;
    quantity: number;
  }[];
};

function CreatePurchaseOrder() {
  const { state, dispatch, getArticle } = useWms();
  const { toast } = useToast();
  const suppliers = Array.from(state.tiers.values()).filter(
    (t) => t.type === "Fournisseur" && t.createdBy === state.currentUser?.username
  );
  const articles = Array.from(state.articles.values());

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
          Passez une commande auprès d'un fournisseur que vous avez créé.
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un article..." />
                        </SelectTrigger>
                        <SelectContent>
                          {articles.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} ({a.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
  const pendingPOs = Array.from(state.documents.values()).filter(
    (d) =>
      d.type === "Bon de Commande Fournisseur" && d.status === "En préparation" && d.createdBy === state.currentUser?.username
  );
  
  const handleReceive = (docId: number) => {
    const doc = state.documents.get(docId);
    if (doc) {
        // In a real scenario, we'd ask for quantities. Here we assume they match.
        dispatch({ type: 'UPDATE_DOCUMENT', payload: {...doc, status: 'Réceptionné'} });
        toast({
            title: "BC Réceptionné",
            description: `La marchandise du BC #${docId} a été ajoutée au stock.`
        })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réceptionner un Bon de Commande</CardTitle>
        <CardDescription>
          Validez la réception des marchandises pour mettre à jour les stocks.
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button>Réceptionner</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la réception ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action mettra à jour les niveaux de stock pour tous les articles de ce bon de commande. Pour ce scénario simplifié, nous supposons que les quantités reçues sont conformes. L'action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleReceive(po.id)}>Confirmer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
  );
}

export function InboundClient() {
  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create">1. Créer un BC</TabsTrigger>
        <TabsTrigger value="receive">2. Réceptionner un BC</TabsTrigger>
      </TabsList>
      <TabsContent value="create">
        <CreatePurchaseOrder />
      </TabsContent>
      <TabsContent value="receive">
        <ReceivePurchaseOrder />
      </TabsContent>
    </Tabs>
  );
}
