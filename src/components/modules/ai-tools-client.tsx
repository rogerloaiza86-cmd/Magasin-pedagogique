
"use client";

import { documentGenerationAssistance } from "@/ai/flows/document-generation-assistance";
import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import { useWms } from "@/context/WmsContext";

type DocGenFormData = {
  documentId: string;
};

export function AiToolsClient() {
  const { state } = useWms();
  const { currentUserPermissions, documents } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    suggestedVerbiage: string;
    suggestedLayout: string;
  } | null>(null);

  const shippedDocuments = useMemo(() => 
    Array.from(documents.values()).filter(doc => doc.type === 'Bon de Livraison Client' && doc.status === 'Expédié'),
    [documents]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DocGenFormData>({
    defaultValues: {
      documentId: "",
    },
  });

  const onSubmit = async (data: DocGenFormData) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await documentGenerationAssistance({ documentId: parseInt(data.documentId, 10) });
      setResult(response);
    } catch (error) {
      console.error(error);
      // Handle error, maybe show a toast
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUserPermissions?.canUseIaTools) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Outils d'IA</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Vous n'avez pas les permissions nécessaires pour utiliser les outils d'IA.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Assistant de Génération de Lettre de Voiture (CMR)</CardTitle>
            <CardDescription>
              Sélectionnez un Bon de Livraison (BL) expédié pour que l'IA vous génère une suggestion de Lettre de Voiture correspondante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <Label htmlFor="documentId">Bon de Livraison à utiliser comme source</Label>
                <Controller
                name="documentId"
                control={control}
                rules={{ required: "Veuillez sélectionner un document." }}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={shippedDocuments.length === 0}>
                    <SelectTrigger id="documentId">
                        <SelectValue placeholder={shippedDocuments.length === 0 ? "Aucun BL expédié trouvé" : "Sélectionner un BL..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {shippedDocuments.map(doc => (
                             <SelectItem key={doc.id} value={doc.id.toString()}>
                                BL #{doc.id} - {state.tiers.get(doc.tierId)?.name || 'Tiers inconnu'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
                />
                {errors.documentId && (
                <p className="text-sm text-destructive mt-1">
                    {errors.documentId.message}
                </p>
                )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || shippedDocuments.length === 0}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Générer une suggestion de CMR
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isLoading && (
         <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4">Génération des suggestions en cours...</p>
         </div>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Suggestion de Formulation pour la Lettre de Voiture</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none whitespace-pre-wrap">
                    <p>{result.suggestedVerbiage}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Suggestion de Mise en Page</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none whitespace-pre-wrap">
                     <p>{result.suggestedLayout}</p>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
