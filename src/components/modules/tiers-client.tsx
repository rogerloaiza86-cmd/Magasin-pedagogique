
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


type TierFormData = Omit<Tier, 'id' | 'createdAt' | 'createdBy' | 'environnementId'> & {
    name: string;
    address: string;
};

function TiersTable({ tiers, type }: { tiers: Tier[], type: string }) {
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Adresse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.length > 0 ? (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.id}</TableCell>
                  <TableCell>{tier.name}</TableCell>
                  <TableCell>{tier.address}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Aucun {type.toLowerCase()} trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    )
}

export function TiersClient() {
  const { state, dispatch } = useWms();
  const { currentUser, currentUserPermissions, currentEnvironmentId } = state;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const currentEnv = state.environments.get(currentEnvironmentId);
  
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TierFormData>({
    defaultValues: { name: "", address: "", type: "Client" },
  });
  
  const selectedType = watch("type");

  const onSubmit = (data: TierFormData) => {
    dispatch({ type: "ADD_TIER", payload: data });
    toast({
      title: "Tiers ajouté",
      description: `Le tiers "${data.name}" a été ajouté avec succès.`,
    });
    reset();
    setIsDialogOpen(false);
  };
  
  const currentUserTiers = Array.from(state.tiers.values()).filter(
    (tier) => tier.createdBy === currentUser?.username && tier.environnementId === currentEnvironmentId
  );

  const clients = currentUserTiers.filter(t => t.type === 'Client');
  const fournisseurs = currentUserTiers.filter(t => t.type === 'Fournisseur');
  const transporteurs = currentUserTiers.filter(t => t.type === 'Transporteur');


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestion des Tiers</CardTitle>
          <CardDescription>
            Consultez et ajoutez vos clients, fournisseurs et transporteurs pour cet environnement.
          </CardDescription>
        </div>
        {currentUserPermissions?.canManageTiers && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>Ajouter un Tiers</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                    <DialogTitle>Ajouter un nouveau Tiers</DialogTitle>
                    <DialogDescription>
                        Remplissez les informations ci-dessous. Le nouveau tiers sera lié à l'environnement actuel.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                        Type
                        </Label>
                        <Controller
                        name="type"
                        control={control}
                        rules={{ required: "Le type est requis" }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Client">Client</SelectItem>
                                <SelectItem value="Fournisseur">Fournisseur</SelectItem>
                                <SelectItem value="Transporteur">Transporteur</SelectItem>
                            </SelectContent>
                            </Select>
                        )}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Controller name="name" control={control} rules={{ required: "Le nom est requis" }} render={({ field }) => <Input id="name" {...field} className="col-span-3" />} />
                        {errors.name && <p className="col-span-4 text-right text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Adresse</Label>
                        <Controller name="address" control={control} rules={{ required: "L'adresse est requise" }} render={({ field }) => <Input id="address" {...field} className="col-span-3" />} />
                        {errors.address && <p className="col-span-4 text-right text-xs text-destructive">{errors.address.message}</p>}
                    </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                        <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clients">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
                <TabsTrigger value="transporteurs">Transporteurs</TabsTrigger>
            </TabsList>
            <TabsContent value="clients" className="mt-4">
                <TiersTable tiers={clients} type="client"/>
            </TabsContent>
            <TabsContent value="fournisseurs" className="mt-4">
                <TiersTable tiers={fournisseurs} type="fournisseur"/>
            </TabsContent>
            <TabsContent value="transporteurs" className="mt-4">
                <TiersTable tiers={transporteurs} type="transporteur"/>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
