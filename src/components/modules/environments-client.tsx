
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, PlusCircle, Trash2, Wand2 } from "lucide-react";
import type { Environment } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function DataGenerator({ environment }: { environment: Environment }) {
    const { dispatch } = useWms();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [articlesToCreate, setArticlesToCreate] = useState(100);
    const [clientsToCreate, setClientsToCreate] = useState(20);
    const [suppliersToCreate, setSuppliersToCreate] = useState(5);

    const handleGenerate = () => {
        setIsLoading(true);
        try {
            dispatch({ 
                type: 'GENERATE_DATA', 
                payload: { 
                    environnementId: environment.id,
                    articles: articlesToCreate,
                    clients: clientsToCreate,
                    suppliers: suppliersToCreate,
                }
            });
            toast({
                title: "Génération de données terminée",
                description: `${articlesToCreate} articles, ${clientsToCreate} clients et ${suppliersToCreate} fournisseurs ont été créés pour ${environment.name}.`
            })
        } catch(e: any) {
            toast({
                variant: 'destructive',
                title: "Erreur lors de la génération",
                description: e.message
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="mt-4 bg-muted/30">
            <CardHeader>
                <CardTitle className="text-lg">Générateur de Données</CardTitle>
                <CardDescription>Peuplez cet environnement avec des données de simulation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="articles">Nombre d'articles</Label>
                        <Input id="articles" type="number" value={articlesToCreate} onChange={e => setArticlesToCreate(Number(e.target.value))} />
                    </div>
                     <div>
                        <Label htmlFor="clients">Nombre de clients</Label>
                        <Input id="clients" type="number" value={clientsToCreate} onChange={e => setClientsToCreate(Number(e.target.value))} />
                    </div>
                     <div>
                        <Label htmlFor="suppliers">Nombre de fournisseurs</Label>
                        <Input id="suppliers" type="number" value={suppliersToCreate} onChange={e => setSuppliersToCreate(Number(e.target.value))} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2"/>}
                    Générer les données
                </Button>
            </CardFooter>
        </Card>
    )
}


export function EnvironmentsClient() {
    const { state, dispatch } = useWms();
    const { currentUserPermissions, environments } = state;
    const { toast } = useToast();

    if (!currentUserPermissions?.isSuperAdmin) {
        return (
            <Card>
                <CardHeader><CardTitle>Accès refusé</CardTitle></CardHeader>
                <CardContent><p>Vous n'avez pas les permissions pour gérer les environnements.</p></CardContent>
            </Card>
        );
    }
    
    const wmsEnvironments = Array.from(environments.values()).filter(env => env.type === 'WMS');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Environnements WMS Fictifs</CardTitle>
                    <CardDescription>Gérez les entrepôts de simulation et peuplez-les avec des données.</CardDescription>
                </CardHeader>
                <CardContent>
                    {wmsEnvironments.map(env => (
                        <Card key={env.id} className="mb-4">
                            <CardHeader>
                                <CardTitle>{env.name}</CardTitle>
                                <CardDescription>{env.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DataGenerator environment={env} />
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
