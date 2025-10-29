
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
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tier, TierType, Maintenance } from "@/lib/types";
import { Badge } from "../ui/badge";
import { PlusCircle, Wrench, Check } from "lucide-react";
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
import { Textarea } from "../ui/textarea";

type VehicleFormData = Omit<Tier, 'id' | 'createdAt' | 'createdBy' | 'environnementId' | 'name' | 'address'> & {
    type: 'Vehicule',
    name: string; // Vehicle type e.g. "Porteur 19T"
    immatriculation: string;
    capacitePalette: number;
    echeanceControleTechnique?: string;
    echeanceAssurance?: string;
};

type MaintenanceFormData = Omit<Maintenance, 'id' | 'environnementId' | 'vehiculeImmat' | 'status' | 'dateRealisation' | 'kilometrageRealisation' | 'cout' | 'notes'> & {
    typeMaintenance: string;
    dateEcheance: string;
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
  const { currentUserPermissions, currentEnvironmentId, maintenances } = state;
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [maintenanceToStart, setMaintenanceToStart] = useState<Tier | null>(null);

  const { control: maintenanceControl, handleSubmit: handleMaintenanceSubmit, reset: resetMaintenanceForm } = useForm<{ notes: string }>();

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
  
  const maintenanceList = Array.from(maintenances.values()).filter(m => m.environnementId === currentEnvironmentId);

  const onSaveVehicle = (data: VehicleFormData) => {
    dispatch({ type: "ADD_TIER", payload: data });
    toast({
      title: "Véhicule ajouté",
      description: `Le véhicule ${data.immatriculation} a été ajouté à la flotte.`,
    });
    setIsFormOpen(false);
  };
  
  const onStartMaintenance = (data: { notes: string }) => {
    if (!maintenanceToStart) return;
    
    dispatch({
        type: 'START_MAINTENANCE',
        payload: {
            vehiculeId: maintenanceToStart.id,
            notes: data.notes
        }
    });

    toast({
        title: "Maintenance Démarrée",
        description: `Le véhicule ${maintenanceToStart.immatriculation} est maintenant en maintenance.`
    });
    
    setMaintenanceToStart(null);
    resetMaintenanceForm();
  };

  const onFinishMaintenance = (maintenanceId: number) => {
     dispatch({ type: 'FINISH_MAINTENANCE', payload: { maintenanceId } });
      toast({
        title: "Maintenance Terminée",
        description: `L'opération a été clôturée et le véhicule est de nouveau disponible.`
    });
  }
  
  const getStatusVariant = (status: Tier['status']) => {
    switch (status) {
        case 'Disponible': return 'default';
        case 'En Maintenance': return 'destructive';
        case 'En Tournée': return 'secondary';
        case 'Hors Service': return 'outline';
        default: return 'secondary';
    }
  }

  return (
    <>
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
                        <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.length > 0 ? (
                        vehicles.map((v) => (
                            <TableRow key={v.id}>
                                <TableCell className="font-medium">{v.immatriculation}</TableCell>
                                <TableCell>{v.name}</TableCell>
                                <TableCell>{v.capacitePalette} palettes</TableCell>
                                <TableCell><Badge variant={getStatusVariant(v.status)}>{v.status}</Badge></TableCell>
                                <TableCell>{v.echeanceControleTechnique ? new Date(v.echeanceControleTechnique).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" disabled={v.status !== 'Disponible'} onClick={() => setMaintenanceToStart(v)}>
                                        <Wrench className="mr-2 h-4 w-4" /> Mettre en maintenance
                                    </Button>
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
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {maintenanceList.length > 0 ? (
                        maintenanceList.map((m) => (
                            <TableRow key={m.id}>
                                <TableCell className="font-medium">{m.vehiculeImmat}</TableCell>
                                <TableCell>{m.typeMaintenance}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{m.notes}</TableCell>
                                <TableCell><Badge variant={m.status === 'En cours' ? 'destructive' : 'default'}>{m.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    {m.status === 'En cours' && (
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm"><Check className="mr-2 h-4 w-4"/>Clôturer</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Clôturer la maintenance ?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Le véhicule redeviendra "Disponible". Cette action est irréversible.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onFinishMaintenance(m.id)}>Confirmer</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                            Aucune opération de maintenance enregistrée.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

     {/* Maintenance Start Dialog */}
      <Dialog open={!!maintenanceToStart} onOpenChange={() => setMaintenanceToStart(null)}>
        <DialogContent>
            <form onSubmit={handleMaintenanceSubmit(onStartMaintenance)}>
                <DialogHeader>
                    <DialogTitle>Mettre le véhicule {maintenanceToStart?.immatriculation} en maintenance</DialogTitle>
                    <DialogDescription>
                        Le statut du véhicule passera à "En Maintenance". Ajoutez une note pour décrire l'intervention.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Label htmlFor="notes">Notes / Raison de la maintenance</Label>
                    <Controller name="notes" control={maintenanceControl} rules={{ required: "Une note est requise."}}
                        render={({field}) => <Textarea id="notes" {...field} />}
                     />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" type="button" onClick={() => setMaintenanceToStart(null)}>Annuler</Button></DialogClose>
                    <Button type="submit">Confirmer et Démarrer</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

    