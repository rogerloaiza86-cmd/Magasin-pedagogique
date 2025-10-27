"use client";

import { documentGenerationAssistance } from "@/ai/flows/document-generation-assistance";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";

type DocGenFormData = {
  documentType: string;
  documentDescription: string;
  relevantInformation: string;
};

export function AiToolsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    suggestedVerbiage: string;
    suggestedLayout: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DocGenFormData>({
    defaultValues: {
      documentType: "Bon de Livraison Client",
      documentDescription: "",
      relevantInformation: "",
    },
  });

  const onSubmit = async (data: DocGenFormData) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await documentGenerationAssistance(data);
      setResult(response);
    } catch (error) {
      console.error(error);
      // Handle error, maybe show a toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Assistant de Génération de Documents</CardTitle>
            <CardDescription>
              Utilisez l'IA pour obtenir des suggestions de formulation et de
              mise en page pour vos documents d'entrepôt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="documentType">Type de document</Label>
                    <Controller
                    name="documentType"
                    control={control}
                    rules={{ required: "Le type de document est requis" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="documentType">
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Bon de Commande Fournisseur">
                            Bon de Commande Fournisseur
                            </SelectItem>
                            <SelectItem value="Bon de Livraison Client">
                            Bon de Livraison Client
                            </SelectItem>
                            <SelectItem value="Lettre de Voiture">
                            Lettre de Voiture
                            </SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                    />
                    {errors.documentType && (
                    <p className="text-sm text-destructive mt-1">
                        {errors.documentType.message}
                    </p>
                    )}
                </div>
            </div>
            <div>
              <Label htmlFor="documentDescription">
                Description du document et de son objectif
              </Label>
              <Controller
                name="documentDescription"
                control={control}
                rules={{
                  required: "La description est requise",
                }}
                render={({ field }) => (
                  <Textarea
                    id="documentDescription"
                    placeholder="Ex: Un bon de livraison pour le client Dupont, contenant des pièces automobiles..."
                    {...field}
                  />
                )}
              />
              {errors.documentDescription && (
                <p className="text-sm text-destructive mt-1">
                  {errors.documentDescription.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="relevantInformation">
                Informations pertinentes à inclure (optionnel)
              </Label>
              <Controller
                name="relevantInformation"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="relevantInformation"
                    placeholder="Ex: Mentionner 'Fragile', numéro de commande client 12345..."
                    {...field}
                  />
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Générer des Suggestions
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
                    <CardTitle>Suggestion de Formulation</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                    <p>{result.suggestedVerbiage}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Suggestion de Mise en Page</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                     <p>{result.suggestedLayout}</p>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
