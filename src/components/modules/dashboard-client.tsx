"use client";

import { useWms } from "@/context/WmsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, Users, FileText, Truck, User, Activity, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import type { User as UserType, Document, Tier } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function StudentDashboard({ articles, tiers, documents }: { articles: Map<string, any>, tiers: Map<number, any>, documents: Map<number, any> }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  let welcomeMessageShown = false;
  if (isClient) {
    welcomeMessageShown = sessionStorage.getItem('welcomeMessageShown') === 'true';
    if (!welcomeMessageShown) {
      sessionStorage.setItem('welcomeMessageShown', 'true');
    }
  }

  return (
    <div className="space-y-6">
      {isClient && !welcomeMessageShown && (
        <Alert className="bg-primary/10 border-primary/20">
          <Boxes className="h-4 w-4" />
          <AlertTitle className="font-bold text-primary">Bienvenue dans le Magasin Pédagogique !</AlertTitle>
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
            Ceci est un outil pédagogique pour simuler les opérations d'un entrepôt. Voici les étapes typiques d'un flux logistique :
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


type StudentProgress = {
    user: UserType;
    flowStep: string;
    docs: { bc: number, bl: number };
    tiers: { f: number, c: number, t: number };
    lastActivity: string;
    lastActivityRelative: string;
};

const getStudentProgress = (student: UserType, allDocs: Document[], allTiers: Tier[], allMovements: any[]): StudentProgress => {
    const userDocs = allDocs.filter(doc => doc.createdBy === student.username);
    const userTiers = allTiers.filter(tier => tier.createdBy === student.username);
    const userMovements = allMovements.filter(mov => mov.user === student.username);

    const bcCount = userDocs.filter(d => d.type === 'Bon de Commande Fournisseur').length;
    const blCount = userDocs.filter(d => d.type === 'Bon de Livraison Client').length;

    const fCount = userTiers.filter(t => t.type === 'Fournisseur').length;
    const cCount = userTiers.filter(t => t.type === 'Client').length;
    const tCount = userTiers.filter(t => t.type === 'Transporteur').length;
    
    let flowStep = '0. Démarrage';
    if (userTiers.length > 0) flowStep = '1. Tiers créés';
    if (bcCount > 0) flowStep = '2. Flux Entrant';
    if (blCount > 0) flowStep = '3. Flux Sortant';
    
    const allActivities = [
        ...userDocs.map(d => d.createdAt), 
        ...userTiers.map(t => t.createdAt), 
        ...userMovements.map(m => m.timestamp)
    ].sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

    const lastActivity = allActivities.length > 0 ? allActivities[0] : student.createdAt || new Date().toISOString();

    return {
        user: student,
        flowStep,
        docs: { bc: bcCount, bl: blCount },
        tiers: { f: fCount, c: cCount, t: tCount },
        lastActivity,
        lastActivityRelative: formatDistanceToNow(parseISO(lastActivity), { addSuffix: true, locale: fr }),
    };
};


function TeacherDashboard() {
    const { state } = useWms();
    const { users, documents, tiers, movements, classes, currentUser } = state;

    const managedClasses = currentUser?.profile === 'Administrateur' 
        ? Array.from(classes.values()) 
        : Array.from(classes.values()).filter(c => c.teacherIds?.includes(currentUser?.username || ''));

    const managedStudents = Array.from(users.values()).filter(u => u.profile === 'élève' && managedClasses.some(mc => mc.id === u.classId));

    const studentProgressData = managedStudents.map(student => getStudentProgress(student, Array.from(documents.values()), Array.from(tiers.values()), movements));

    // KPIs
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeStudents24h = studentProgressData.filter(s => new Date(s.lastActivity) > twentyFourHoursAgo).length;
    
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const docsThisWeek = Array.from(documents.values()).filter(d => new Date(d.createdAt) > weekAgo);
    
    const bcThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Commande Fournisseur').length;
    const blThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Livraison Client').length;
    const receptionsThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Commande Fournisseur' && d.status === 'Réceptionné').length;
    const shipmentsThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Livraison Client' && d.status === 'Expédié').length;


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Enseignant</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Élèves Actifs (24h)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeStudents24h} / {managedStudents.length}</div>
                        <p className="text-xs text-muted-foreground">sur les classes gérées</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">BC créés (semaine)</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bcThisWeek}</div>
                         <p className="text-xs text-muted-foreground">Bons de commande</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">BL créés (semaine)</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{blThisWeek}</div>
                        <p className="text-xs text-muted-foreground">Bons de livraison</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Opérations (semaine)</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{receptionsThisWeek + shipmentsThisWeek}</div>
                        <p className="text-xs text-muted-foreground">{receptionsThisWeek} réceptions, {shipmentsThisWeek} expéditions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tableau de Suivi de la Classe</CardTitle>
                    <CardDescription>
                        Suivez la progression de chaque élève dans le flux logistique.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom de l'Élève</TableHead>
                                <TableHead>Classe</TableHead>
                                <TableHead>Étape du Flux</TableHead>
                                <TableHead>Documents Créés</TableHead>
                                <TableHead>Tiers Créés</TableHead>
                                <TableHead>Dernière Activité</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentProgressData.length > 0 ? (
                                studentProgressData.sort((a,b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()).map(s => {
                                   const studentClass = classes.get(s.user.classId || 0);
                                   return (
                                        <TableRow key={s.user.username}>
                                            <TableCell className="font-medium flex items-center gap-2"><User size={16}/> {s.user.username}</TableCell>
                                            <TableCell><Badge variant="secondary">{studentClass?.name || 'N/A'}</Badge></TableCell>
                                            <TableCell><Badge variant="outline">{s.flowStep}</Badge></TableCell>
                                            <TableCell>BC: {s.docs.bc}, BL: {s.docs.bl}</TableCell>
                                            <TableCell>F: {s.tiers.f}, C: {s.tiers.c}, T: {s.tiers.t}</TableCell>
                                            <TableCell><div className="flex items-center gap-2"><Clock size={14} />{s.lastActivityRelative}</div></TableCell>
                                        </TableRow>
                                   )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Aucun élève à superviser pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


export function DashboardClient() {
  const { state } = useWms();
  const { articles, tiers, documents, currentUser } = state;
  
  if (!currentUser) {
    return null; // Or a loading skeleton
  }

  if (currentUser.profile === 'professeur' || currentUser.profile === 'Administrateur') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard articles={articles} tiers={tiers} documents={documents} />;
}

    