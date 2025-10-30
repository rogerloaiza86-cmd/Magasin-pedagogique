
"use client";

import { useWms } from "@/context/WmsContext";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Tier, Document, DevisTransportDetails, GrilleTarifaire } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { Badge } from "../ui/badge";

type DevisFormData = Omit<DevisTransportDetails, 'prixCalculeHT'> & {
    tierId: string;
};

const calculatePrice = (data: Partial<DevisFormData>, grille: GrilleTarifaire | undefined): number => {
    if (!grille || !data.distance || !data.poids) return 0;
    
    const distance = Number(data.distance);
    const poids = Number(data.poids);

    let prixKm = 0;
    const sortedDistances = [...grille.tarifs.distance].sort((a,b) => a.palier - b.palier);
    for(const palier of sortedDistances) {
        if(distance <= palier.palier) {
            prixKm = palier.prixKm;
            break;
        }
    }
    
    let supplementPoids = 0;
    const sortedPoids = [...grille.tarifs.poids].sort((a,b) => a.palier - b.palier);
    for(const palier of sortedPoids) {
        if(poids <= palier.palier) {
            supplementPoids = palier.supplement;
            break;
        }
    }

    const prixTotal = grille.tarifs.base + (distance * prixKm) + supplementPoids;
    return prixTotal;
}

function DevisForm({ onSave, onCancel }: { onSave: (data: Document) => void, onCancel: () => void }) {
    const { state } = useWms();
    const { currentUser, currentEnvironmentId } = state;
    const clients = useMemo(() => Array.from(state.tiers.values()).filter(t => t.type === 'Client' && t.environnementId === currentEnvironmentId), [state.tiers, currentEnvironmentId]);
    const grille = useMemo(() => state.grillesTarifaires.get('default_tms'), [state.grillesTarifaires]);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<DevisFormData>({
        defaultValues: {
            tierId: "",
            departAddress: "",
            arriveeAddress: "",
            distance: 0,
            poids: 0,
            nombrePalettes: 1,
            dateEnlevement: new Date().toISOString().split("T")[0],
        }
    });

    const watchedDistance = watch("distance");
    const watchedPoids = watch("poids");

    useEffect(() => {
        const newPrice = calculatePrice({ distance: watchedDistance, poids: watchedPoids }, grille);
        setValue('prixCalculeHT', newPrice, { shouldValidate: true });
    }, [watchedDistance, watchedPoids, grille, setValue]);

    const onSubmit = (data: DevisFormData) => {
        const { tierId, ...devisDetails } = data;
        const finalPrice = calculatePrice(data, grille);
        
        const newDocument: Omit<Document, 'id' | 'createdAt' | 'createdBy' | 'environnementId'> = {
            type: 'Devis Transport',
            tierId: parseInt(tierId),
            status: 'Brouillon',
            lines: [], // Not used for quotes
            devisDetails: {
                ...devisDetails,
                distance: Number(devisDetails.distance),
                poids: Number(devisDetails.poids),
                nombrePalettes: Number(devisDetails.nombrePalettes),
                prixCalculeHT: finalPrice
            },
        };
        onSave(newDocument as Document);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
                <DialogTitle>Créer un nouveau Devis Transport</DialogTitle>
                <DialogDescription>
                    Remplissez les informations pour calculer et enregistrer un devis.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                 <div>
                    <Label htmlFor="tierId">Client</Label>
                    <Controller name="tierId" control={control} rules={{ required: "Client requis" }} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Choisir un client..."/></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select>
                    )} />
                     {errors.tierId && <p className="text-destructive text-sm mt-1">{errors.tierId.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="departAddress">Adresse de départ</Label>
                    <Controller name="departAddress" control={control} rules={{ required: "Adresse requise" }} render={({ field }) => <Input id="departAddress" {...field} />} />
                     {errors.departAddress && <p className="text-destructive text-sm mt-1">{errors.departAddress.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="arriveeAddress">Adresse d'arrivée</Label>
                    <Controller name="arriveeAddress" control={control} rules={{ required: "Adresse requise" }} render={({ field }) => <Input id="arriveeAddress" {...field} />} />
                     {errors.arriveeAddress && <p className="text-destructive text-sm mt-1">{errors.arriveeAddress.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="dateEnlevement">Date d'enlèvement</Label>
                        <Controller name="dateEnlevement" control={control} rules={{ required: "Date requise" }} render={({ field }) => <Input type="date" id="dateEnlevement" {...field} />} />
                    </div>
                     <div>
                        <Label htmlFor="distance">Distance (km)</Label>
                        <Controller name="distance" control={control} rules={{ required: "Distance requise", min: 1 }} render={({ field }) => <Input type="number" id="distance" {...field} />} />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="poids">Poids (kg)</Label>
                        <Controller name="poids" control={control} rules={{ required: "Poids requis", min: 1 }} render={({ field }) => <Input type="number" id="poids" {...field} />} />
                    </div>
                     <div>
                        <Label htmlFor="nombrePalettes">Nombre de palettes</Label>
                        <Controller name="nombrePalettes" control={control} rules={{ required: "Champ requis", min: 1 }} render={({ field }) => <Input type="number" id="nombrePalettes" {...field} />} />
                    </div>
                </div>
                <Card className="mt-4">
                    <CardHeader><CardTitle>Estimation du Prix</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{calculatePrice({ distance: watchedDistance, poids: watchedPoids }, grille).toFixed(2)} € <span className="text-sm font-normal text-muted-foreground">HT</span></p>
                        <p className="text-xs text-muted-foreground mt-2">Calculé avec la grille tarifaire: {grille?.name}</p>
                    </CardContent>
                </Card>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button></DialogClose>
                <Button type="submit">Enregistrer le Devis</Button>
            </DialogFooter>
        </form>
    );
}

export function DevisClient() {
  const { state, dispatch, getTier } = useWms();
  const { currentUserPermissions, currentEnvironmentId } = state;
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!currentUserPermissions?.canManageQuotes) {
    return (
        <Card>
            <CardHeader><CardTitle>Accès refusé</CardTitle></CardHeader>
            <CardContent><p>Vous n'avez pas les permissions pour gérer les devis.</p></CardContent>
        </Card>
    );
  }

  const devis = Array.from(state.documents.values()).filter(
    (doc) => doc.type === 'Devis Transport' && doc.environnementId === currentEnvironmentId
  ).sort((a, b) => b.id - a.id);

  const onSaveDevis = (data: Document) => {
    dispatch({ type: "CREATE_DOCUMENT", payload: data });
    toast({
      title: "Devis Enregistré",
      description: `Le devis pour ${getTier(data.tierId)?.name} a été créé.`,
    });
    setIsFormOpen(false);
  };

  const getStatusVariant = (status: Document['status']) => {
    switch(status) {
        case 'Brouillon': return 'secondary';
        case 'Envoyé': return 'default';
        case 'Accepté': return 'default';
        case 'Refusé': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <>
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Liste des Devis</CardTitle>
            <CardDescription>
                Affichez, créez et gérez les devis de transport.
            </CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2"/>Nouveau Devis</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DevisForm onSave={onSaveDevis} onCancel={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Devis #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant HT</TableHead>
                    <TableHead>Statut</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devis.length > 0 ? (
                    devis.map((d) => (
                        <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.id}</TableCell>
                            <TableCell>{getTier(d.tierId)?.name}</TableCell>
                            <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{d.devisDetails?.prixCalculeHT.toFixed(2)} €</TableCell>
                            <TableCell><Badge variant={getStatusVariant(d.status)}>{d.status}</Badge></TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        Aucun devis créé.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
    </>
  );
}
