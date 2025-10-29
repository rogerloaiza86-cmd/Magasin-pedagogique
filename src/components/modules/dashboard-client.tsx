
"use client";

import { useWms } from "@/context/WmsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Boxes, Users, FileText, Truck, User, Activity, Clock, CheckSquare, ListTodo, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import type { User as UserType, Document, Tier, Task } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function StudentDashboard() {
  const { state } = useWms();
  const { articles, tiers, documents, currentUser, activeScenarios, tasks, roles, currentEnvironmentId } = state;
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const studentActiveScenario = currentUser ? Array.from(activeScenarios.values()).find(sc => {
      const studentClassId = currentUser.classId;
      return sc.classId === studentClassId && sc.status === 'running' && sc.environnementId === currentEnvironmentId;
  }) : undefined;
  
  const studentTasks = currentUser && studentActiveScenario 
    ? Array.from(tasks.values()).filter(t => t.userId === currentUser.username && t.scenarioId === studentActiveScenario.id).sort((a,b) => a.taskOrder - b.taskOrder)
    : [];

  let welcomeMessageShown = false;
  if (isClient) {
    const welcomeKey = `welcomeMessageShown_${currentUser?.username}`;
    welcomeMessageShown = sessionStorage.getItem(welcomeKey) === 'true';
    if (!welcomeMessageShown) {
      sessionStorage.setItem(welcomeKey, 'true');
    }
  }
  
  const TaskIcon = ({status}: {status: Task['status']}) => {
    switch(status) {
        case 'completed': return <CheckSquare className="h-5 w-5 text-green-500"/>
        case 'todo': return <ListTodo className="h-5 w-5 text-blue-500"/>
        case 'blocked': return <Lock className="h-5 w-5 text-muted-foreground"/>
        default: return null;
    }
  }
  
  const studentRole = currentUser ? roles.get(currentUser.roleId) : null;
  const currentEnv = state.environments.get(currentEnvironmentId);


  return (
    <div className="space-y-6">
      {!studentActiveScenario && isClient && !welcomeMessageShown && currentEnv?.type === 'WMS' && (
        <Alert className="bg-primary/10 border-primary/20">
          <Boxes className="h-4 w-4" />
          <AlertTitle className="font-bold text-primary">Bienvenue dans l'environnement {currentEnv?.name} !</AlertTitle>
          <AlertDescription>
             Vous pouvez commencer à explorer l'application ou attendre que votre enseignant lance un scénario pour votre classe.
          </AlertDescription>
        </Alert>
      )}

      <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
      
      {currentEnv?.type === 'TMS' && (
        <Card>
            <CardHeader>
                <CardTitle>Module de Gestion des Transports (TMS)</CardTitle>
                <CardDescription>Ce module est en cours de développement.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Les fonctionnalités de gestion des devis, des tournées et du parc de véhicules seront bientôt disponibles ici.</p>
            </CardContent>
        </Card>
      )}

      {studentActiveScenario && (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950">
            <CardHeader>
                <CardTitle>Scénario en cours : {state.scenarioTemplates.get(studentActiveScenario.templateId)?.title}</CardTitle>
                <CardDescription>Votre rôle : <span className="font-bold">{studentRole?.name || 'Chargement...'}</span>. Suivez les étapes ci-dessous.</CardDescription>
            </CardHeader>
            <CardContent>
                 {studentTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {studentTasks.map(task => (
                            <li key={task.id} className={`flex items-start gap-4 p-3 rounded-md ${task.status === 'todo' ? 'bg-background shadow-sm' : 'bg-transparent'}`}>
                            <TaskIcon status={task.status} />
                            <div className="flex-1">
                                    <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''} ${task.status === 'blocked' ? 'text-muted-foreground' : ''}`}>{task.description}</p>
                            </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">Les tâches pour votre rôle sont en cours d'assignation...</p>
                )}
            </CardContent>
        </Card>
      )}


      {currentEnv?.type === 'WMS' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Articles Uniques</CardTitle>
                <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{Array.from(articles.values()).filter(a => a.environnementId === currentEnvironmentId).length}</div>
                <p className="text-xs text-muted-foreground">Références dans cet environnement</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiers Créés par vous</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{Array.from(tiers.values()).filter(t => t.createdBy === currentUser?.username && t.environnementId === currentEnvironmentId).length}</div>
                <p className="text-xs text-muted-foreground">Clients, fournisseurs et transporteurs</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Créés par vous</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{Array.from(documents.values()).filter(d => d.createdBy === currentUser?.username && d.environnementId === currentEnvironmentId).length}</div>
                <p className="text-xs text-muted-foreground">BC, BL et Lettres de Voiture</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes en Préparation</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {Array.from(documents.values()).filter(d => d.status === 'En préparation' && d.type === 'Bon de Livraison Client' && d.environnementId === currentEnvironmentId).length}
                </div>
                <p className="text-xs text-muted-foreground">Bons de livraison en attente</p>
            </CardContent>
            </Card>
        </div>
      )}

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

const getStudentProgress = (student: UserType, allDocs: Document[], allTiers: Tier[], allMovements: any[], envId: string): StudentProgress => {
    const userDocs = allDocs.filter(doc => doc.createdBy === student.username && doc.environnementId === envId);
    const userTiers = allTiers.filter(tier => tier.createdBy === student.username && tier.environnementId === envId);
    const userMovements = allMovements.filter(mov => mov.user === student.username && mov.environnementId === envId);

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
    const { users, documents, tiers, movements, classes, currentUser, currentEnvironmentId } = state;

    const managedClasses = currentUser?.profile === 'Administrateur' 
        ? Array.from(classes.values()) 
        : Array.from(classes.values()).filter(c => c.teacherIds?.includes(currentUser?.username || ''));

    const managedStudents = Array.from(users.values()).filter(u => u.profile === 'élève' && managedClasses.some(mc => mc.id === u.classId));

    const studentProgressData = managedStudents.map(student => getStudentProgress(student, Array.from(documents.values()), Array.from(tiers.values()), movements, currentEnvironmentId));

    // KPIs
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeStudents24h = studentProgressData.filter(s => new Date(s.lastActivity) > twentyFourHoursAgo).length;
    
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const docsThisWeek = Array.from(documents.values()).filter(d => new Date(d.createdAt) > weekAgo && d.environnementId === currentEnvironmentId);
    
    const bcThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Commande Fournisseur').length;
    const blThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Livraison Client').length;
    const receptionsThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Commande Fournisseur' && d.status === 'Réceptionné').length;
    const shipmentsThisWeek = docsThisWeek.filter(d => d.type === 'Bon de Livraison Client' && d.status === 'Expédié').length;
    const currentEnv = state.environments.get(currentEnvironmentId);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Enseignant</h1>
            <p className="text-muted-foreground">Vue d'ensemble de l'environnement : <span className="font-semibold text-foreground">{currentEnv?.name}</span></p>

            {currentEnv?.type === 'TMS' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Module de Gestion des Transports (TMS)</CardTitle>
                        <CardDescription>Ce module est en cours de développement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Les fonctionnalités de gestion des devis, des tournées et du parc de véhicules seront bientôt disponibles ici.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
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
                            Suivez la progression de chaque élève dans le flux logistique pour cet environnement.
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
            </>
            )}
        </div>
    );
}


export function DashboardClient() {
  const { state } = useWms();
  const { currentUser } = state;
  
  if (!currentUser) {
    return null; // Or a loading skeleton
  }

  if (currentUser.profile === 'professeur' || currentUser.profile === 'Administrateur') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}
