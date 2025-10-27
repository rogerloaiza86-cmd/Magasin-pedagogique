"use client";

import { useWms } from "@/context/WmsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, Users, FileText, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DashboardClient() {
  const { state } = useWms();
  const { articles, tiers, documents } = state;
  
  const welcomeMessageShown = typeof window !== 'undefined' && sessionStorage.getItem('welcomeMessageShown');

  if (typeof window !== 'undefined' && !welcomeMessageShown) {
    sessionStorage.setItem('welcomeMessageShown', 'true');
  }

  return (
    <div className="space-y-6">
      {!welcomeMessageShown && (
        <Alert className="bg-primary/10 border-primary/20">
          <Boxes className="h-4 w-4" />
          <AlertTitle className="font-bold text-primary">Bienvenue dans LogiSim !</AlertTitle>
          <AlertDescription>
            J'ai chargé avec succès {articles.size} articles dans la base de données. Que souhaitez-vous faire ?
          </AlertDescription>
        </Alert>
      )}

      <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Articles Uniques
            </CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.size}</div>
            <p className="text-xs text-muted-foreground">
              Nombre total de références articles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiers Enregistrés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers.size}</div>
            <p className="text-xs text-muted-foreground">
              Clients, fournisseurs et transporteurs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Créés</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.size}</div>
            <p className="text-xs text-muted-foreground">
              BC, BL et Lettres de Voiture
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes en Préparation</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from(documents.values()).filter(d => d.status === 'En préparation' && d.type === 'Bon de Livraison Client').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Bons de livraison en attente
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guide de Démarrage Rapide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            LogiSim est un outil pédagogique pour simuler les opérations d'un entrepôt. Voici les étapes typiques d'un flux logistique :
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Gestion des Tiers :</strong> Commencez par ajouter un fournisseur, un client et un transporteur.
            </li>
            <li>
              <strong>Flux Entrant :</strong> Créez un Bon de Commande (BC) pour un fournisseur, puis réceptionnez la marchandise pour augmenter votre stock.
            </li>
            <li>
              <strong>Flux Sortant :</strong> Créez un Bon de Livraison (BL) pour un client, préparez la commande (picking), puis expédiez-la, ce qui générera les documents finaux (BL et Lettre de Voiture).
            </li>
            <li>
              <strong>Gestion des Stocks :</strong> À tout moment, consultez l'état de vos stocks, l'historique des mouvements ou effectuez des ajustements d'inventaire.
            </li>
          </ol>
          <p>
            Utilisez le menu sur la gauche pour naviguer entre les différents modules.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
