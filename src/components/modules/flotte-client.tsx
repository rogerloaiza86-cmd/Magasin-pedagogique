
"use client";

import { useWms } from "@/context/WmsContext";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tier, TierType } from "@/lib/types";
import { Badge } from "../ui/badge";
import { PlusCircle } from "lucide-react";


type VehicleFormData = Omit<Tier, 'id' | 'createdAt' | 'createdBy' | 'environnementId' | 'name' | 'address'> & {
    type: 'Vehicule',
    name: string; // Vehicle type e.g. "Porteur 19T"
    immatriculation: string;
    capacitePalette: number;
    echeanceControleTechnique?: string;
    echeanceAssurance?: string;
};

function VehicleForm({ onSave, onCancel }: { onSave: (data: VehicleFormData) => void, onCancel: () => void }) {
    const { control, handleSubmit, formState: { errors } } = useForm<VehicleFormData>({
        defaultValues: {
            type: 'Vehicule',
            name: '',
            immatriculation: '',
            capacitePalette: 0,
            echeanceControleTechnique: new Date().toISOString().split('T')[0],
            echeanceAssurance: new Date().toISOString().split('T')[0],
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)}>
            <DialogHeader>
                <DialogTitle>Ajouter un nouveau véhicule</DialogTitle>
                <DialogDescription>
                    Remplissez les informations ci-dessous. Le véhicule sera lié à l'environnement TMS actuel.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="immatriculation" className="text-right">Immatriculation</Label>
                    <Controller name="immatriculation" control={control} rules={{ required: "Immatriculation requise" }} render={({ field }) => <Input id="immatriculation" {...field} className="col-span-3" />} />
                    {errors.immatriculation && <p className="col-span-4 text-right text-xs text-destructive">{errors.immatriculation.message}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Type de véhicule</Label>
                    <Controller name="name" control={control} rules={{ required: "Type requis" }} render={({ field }) => <Input id="name" {...field} placeholder="ex: Porteur 19T" className="col-span-3" />} />
                    {errors.name && <p className="col-span-4 text-right text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capacitePalette" className="text-right">Capacité (Palettes)</Label>
                    <Controller name="capacitePalette" control={control} rules={{ required: "Capacité requise", min: 1, valueAsNumber: true }} render={({ field }) => <Input id="capacitePalette" type="number" {...field} className="col-span-3" />} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="echeanceControleTechnique" className="text-right">Échéance CT</Label>
                    <Controller name="echeanceControleTechnique" control={control} render={({ field }) => <Input id="echeanceControleTechnique" type="date" {...field} className="col-span-3" />} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="echeanceAssurance" className="text-right">Échéance Assurance</Label>
                    <Controller name="echeanceAssurance" control={control} render={({ field }) => <Input id="echeanceAssurance" type="date" {...field} className="col-span-3" />} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button></DialogClose>
                <Button type="submit">Enregistrer</Button>
            </DialogFooter>
        </form>
    );
}

export function FlotteClient() {
  const { state, dispatch } = useWms();
  const { currentUserPermissions, currentEnvironmentId } = state;
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!currentUserPermissions?.canManageFleet) {
    return (
        <Card>
            <CardHeader><CardTitle>Accès refusé</CardTitle></CardHeader>
            <CardContent><p>Vous n'avez pas les permissions pour gérer la flotte.</p></CardContent>
        </Card>
    );
  }

  const vehicles = Array.from(state.tiers.values()).filter(
    (tier) => tier.type === 'Vehicule' && tier.environnementId === currentEnvironmentId
  );

  const onSaveVehicle = (data: VehicleFormData) => {
    dispatch({ type: "ADD_TIER", payload: data });
    toast({
      title: "Véhicule ajouté",
      description: `Le véhicule ${data.immatriculation} a été ajouté à la flotte.`,
    });
    setIsFormOpen(false);
  };
  
  return (
    <Tabs defaultValue="parc">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="parc">Vue du Parc</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
      </TabsList>
      <TabsContent value="parc">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle>Vue du Parc de Véhicules</CardTitle>
                <CardDescription>
                    Affichez, ajoutez et gérez les véhicules de votre flotte.
                </CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2"/>Ajouter un Véhicule</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <VehicleForm onSave={onSaveVehicle} onCancel={() => setIsFormOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Immatriculation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Prochain CT</TableHead>
                        <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.length > 0 ? (
                        vehicles.map((v) => (
                            <TableRow key={v.id}>
                                <TableCell className="font-medium">{v.immatriculation}</TableCell>
                                <TableCell>{v.name}</TableCell>
                                <TableCell>{v.capacitePalette} palettes</TableCell>
                                <TableCell><Badge variant={v.status === 'Disponible' ? 'default' : 'secondary'}>{v.status}</Badge></TableCell>
                                <TableCell>{v.echeanceControleTechnique ? new Date(v.echeanceControleTechnique).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" disabled={v.status !== 'Disponible'}>Mettre en maintenance</Button>
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                            Aucun véhicule dans le parc.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="maintenance">
         <Card>
            <CardHeader>
                <CardTitle>Carnet d'Entretien</CardTitle>
                <CardDescription>Planifiez et suivez les maintenances de vos véhicules.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-8">Le module de maintenance est en cours de développement.</p>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
