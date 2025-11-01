
"use client";

import { useWms } from "@/context/WmsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Users,
    Warehouse,
    ArrowDownToLine,
    ArrowUpFromLine,
    BrainCircuit,
    FileText,
    BookUser,
    Mail,
    Swords,
    Truck,
    Archive,
    FileSignature,
    CheckCircle2,
    Package,
    AlertTriangle,
    RotateCcw,
    Siren,
    Info,
    PackageX
} from "lucide-react";
import Link from "next/link";
import type { Environment, Task } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type AppItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
  permission?: 
    | 'canViewDashboard' 
    | 'canViewTiers' 
    | 'canCreateBC' 
    | 'canReceiveBC' 
    | 'canCreateBL' 
    | 'canPrepareBL' 
    | 'canShipBL'
    | 'canViewStock'
    | 'canManageClasses'
    | 'canUseIaTools'
    | 'canUseMessaging'
    | 'canManageScenarios'
    | 'canManageFleet'
    | 'canManageQuotes';
  envType: Environment['type'] | 'ALL';
  isSuperAdminOnly?: boolean;
};

const appItems: AppItem[] = [
  { href: "/stock", label: "Inventaire", icon: Warehouse, color: "text-purple-500", permission: 'canViewStock', envType: 'WMS' },
  { href: "/articles", label: "Articles", icon: Archive, color: "text-orange-500", permission: 'canViewStock', envType: 'WMS'},
  { href: "/flux-entrant", label: "Achats", icon: ArrowDownToLine, color: "text-sky-500", permission: 'canCreateBC', envType: 'WMS' },
  { href: "/flux-sortant", label: "Ventes", icon: ArrowUpFromLine, color: "text-red-500", permission: 'canCreateBL', envType: 'WMS' },
  { href: "/tiers", label: "Tiers", icon: Users, color: "text-green-500", permission: 'canViewTiers', envType: 'ALL' },
  { href: "/devis", label: "Devis", icon: FileSignature, color: "text-pink-500", permission: 'canManageQuotes', envType: 'TMS' },
  { href: "/flotte", label: "Flotte", icon: Truck, color: "text-yellow-500", permission: 'canManageFleet', envType: 'TMS' },
  { href: "/documents", label: "Documents", icon: FileText, color: "text-indigo-500", permission: 'canViewDashboard', envType: 'ALL' },
  { href: "/messaging", label: "Messagerie", icon: Mail, color: "text-blue-500", permission: 'canUseMessaging', envType: 'ALL' },
  { href: "/scenarios", label: "Scénarios", icon: Swords, color: "text-rose-500", permission: 'canManageScenarios', envType: 'ALL'},
  { href: "/ia-tools", label: "Outils d'IA", icon: BrainCircuit, color: "text-cyan-500", permission: 'canUseIaTools', envType: 'ALL' },
  { href: "/classes", label: "Classes", icon: BookUser, color: "text-amber-500", isSuperAdminOnly: true, envType: 'ALL', permission: 'canManageClasses' },
];

function AppCard({ item }: { item: AppItem }) {
  return (
    <Link href={item.href} className="group block">
      <Card className="h-full bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-black/30 hover:bg-white/70 dark:hover:bg-black/70 transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4 h-full">
          <div className="bg-primary/10 p-4 rounded-full">
            <item.icon className={`h-8 w-8 ${item.color}`} />
          </div>
          <p className="font-semibold text-foreground">{item.label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function KpiCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

function ScenarioProgress() {
    const { state } = useWms();
    const { currentUser, tasks, activeScenarios, currentEnvironmentId, environments } = state;
    
    if (!currentUser || !currentUser.classId) return null;

    const userActiveScenario = Array.from(activeScenarios.values()).find(sc => sc.classId === currentUser.classId && sc.status === 'running');
    if (!userActiveScenario) return null;

    const userTasks = Array.from(tasks.values()).filter(t => t.userId === currentUser.username && t.scenarioId === userActiveScenario.id);
    const tasksInCurrentEnv = userTasks.filter(t => t.environnementId === currentEnvironmentId && t.status === 'todo');
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    
    const otherEnvTasks = userTasks.filter(t => t.environnementId !== currentEnvironmentId && t.status === 'todo');
    const nextEnvId = otherEnvTasks.length > 0 ? otherEnvTasks[0].environnementId : null;
    const nextEnv = nextEnvId ? environments.get(nextEnvId) : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Progression du Scénario</CardTitle>
                <CardDescription>Suivez les tâches qui vous sont assignées pour le scénario en cours.</CardDescription>
            </CardHeader>
            <CardContent>
                {tasksInCurrentEnv.length > 0 ? (
                    <ul className="space-y-2">
                        {tasksInCurrentEnv.map(task => (
                             <li key={task.id} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 mt-1 text-sky-500" />
                                <div>
                                    <p className="font-semibold">{task.description}</p>
                                    <Badge variant="secondary" className="mt-1">{state.roles.get(currentUser.roleId)?.name}</Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <p>Vous avez terminé toutes vos tâches dans cet environnement.</p>
                        {nextEnv && <p className="font-semibold mt-2">Passez à l'environnement "{nextEnv.name}" pour continuer !</p>}
                    </div>
                )}
                 <div className="mt-4 text-sm text-muted-foreground">
                    <p>Tâches complétées : {completedTasks} / {totalTasks}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function SystemAlerts() {
    const { state } = useWms();
    const { articles, currentEnvironmentId } = state;
    const articlesInEnv = Array.from(articles.values()).filter(a => a.environnementId === currentEnvironmentId);

    const outOfStockArticles = articlesInEnv.filter(a => a.stock === 0).length;
    const lowStockArticles = articlesInEnv.filter(a => a.stock > 0 && a.stock < 5).length;

    if (outOfStockArticles === 0 && lowStockArticles === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Siren className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-xl">Alertes Système</CardTitle>
                </div>
                <CardDescription>Informations importantes sur l'état de l'entrepôt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {outOfStockArticles > 0 && (
                    <Alert variant="destructive">
                        <PackageX className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Rupture de Stock</AlertTitle>
                        <AlertDescription>
                            {outOfStockArticles} article(s) sont en rupture de stock.
                        </AlertDescription>
                    </Alert>
                )}
                {lowStockArticles > 0 && (
                     <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Stock Faible</AlertTitle>
                        <AlertDescription>
                           {lowStockArticles} article(s) sont sous le seuil d'alerte (moins de 5 unités).
                        </AlertDescription>
                    </Alert>
                )}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>
                        Les données de stock sont synchronisées en temps réel.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}

export function DashboardClient() {
  const { state } = useWms();
  const { currentUser, currentUserPermissions, environments, currentEnvironmentId, documents, articles } = state;
  const currentEnv = environments.get(currentEnvironmentId);

  const visibleAppItems = appItems.filter(item => {
    if (item.isSuperAdminOnly && !currentUserPermissions?.isSuperAdmin) {
        return false;
    }
    if (item.permission && !currentUserPermissions?.[item.permission]) {
        return false;
    }
    if (item.envType !== 'ALL' && item.envType !== currentEnv?.type) {
        return false;
    }
     if (item.href === "/flux-entrant") {
      return currentUserPermissions.canCreateBC || currentUserPermissions.canReceiveBC;
    }
    if (item.href === "/flux-sortant") {
      return currentUserPermissions.canCreateBL || currentUserPermissions.canPrepareBL || currentUserPermissions.canShipBL;
    }
    return true;
  });

  // KPIs
  const pendingPOs = Array.from(documents.values()).filter(d => d.environnementId === currentEnvironmentId && d.type === 'Bon de Commande Fournisseur' && d.status === 'En préparation').length;
  const pendingSOs = Array.from(documents.values()).filter(d => d.environnementId === currentEnvironmentId && d.type === 'Bon de Livraison Client' && d.status === 'En préparation').length;
  const articlesInStock = Array.from(articles.values()).filter(a => a.environnementId === currentEnvironmentId).length;
  const pendingReturns = Array.from(documents.values()).filter(d => d.environnementId === currentEnvironmentId && d.type === 'Retour Client' && d.status === 'En attente de traitement').length;

  const showKpis = currentEnv?.type === 'WMS';
  const showSystemAlerts = currentEnv?.type === 'WMS';

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Bonjour, {currentUser?.username} !</h1>
            <p className="text-muted-foreground">Bienvenue dans votre espace {currentEnv?.name}. Choisissez une application pour commencer.</p>
        </div>

        {showSystemAlerts && <SystemAlerts />}

        {showKpis && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="BC en attente de réception" value={pendingPOs} icon={ArrowDownToLine} color="text-sky-500" />
                <KpiCard title="BL en attente de préparation" value={pendingSOs} icon={ArrowUpFromLine} color="text-red-500" />
                <KpiCard title="Articles en Stock" value={articlesInStock} icon={Package} color="text-purple-500" />
                <KpiCard title="Retours à traiter" value={pendingReturns} icon={RotateCcw} color="text-orange-500" />
            </div>
        )}

        {currentUser?.profile === 'élève' && <ScenarioProgress />}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {visibleAppItems.map((item) => (
                <AppCard key={item.href} item={item} />
            ))}
        </div>
    </div>
  );
}

    