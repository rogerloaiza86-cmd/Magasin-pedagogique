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

type TierFormData = {
  name: string;
  address: string;
  type: "Client" | "Fournisseur" | "Transporteur";
};

export function TiersClient() {
  const { state, dispatch } = useWms();
  const tiers = Array.from(state.tiers.values());
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TierFormData>({
    defaultValues: { name: "", address: "", type: "Client" },
  });

  const onSubmit = (data: TierFormData) => {
    dispatch({ type: "ADD_TIER", payload: data });
    toast({
      title: "Tiers ajouté",
      description: `Le tiers "${data.name}" a été ajouté avec succès.`,
    });
    reset();
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Liste des Tiers</CardTitle>
          <CardDescription>
            Consultez et ajoutez des clients, fournisseurs et transporteurs.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter un Tiers</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau Tiers</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Le nom est requis" }}
                  render={({ field }) => <Input id="name" {...field} className="col-span-3" />}
                />
                {errors.name && <p className="col-span-4 text-right text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Adresse
                </Label>
                <Controller
                  name="address"
                  control={control}
                  rules={{ required: "L'adresse est requise" }}
                  render={({ field }) => <Input id="address" {...field} className="col-span-3" />}
                />
                 {errors.address && <p className="col-span-4 text-right text-xs text-destructive">{errors.address.message}</p>}
              </div>
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
                {errors.type && <p className="col-span-4 text-right text-xs text-destructive">{errors.type.message}</p>}
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Adresse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.length > 0 ? (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.id}</TableCell>
                  <TableCell>{tier.type}</TableCell>
                  <TableCell>{tier.name}</TableCell>
                  <TableCell>{tier.address}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Aucun tiers trouvé. Commencez par en ajouter un.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
