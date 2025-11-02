
"use client";

import { useWms } from "@/context/WmsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Users,
    Warehouse,
    ArrowDownToLine,
    ArrowUpFromLine,
    FileText,
    BookUser,
    Mail,
    Archive,
    CheckCircle2,
    Package,
    AlertTriangle,
    RotateCcw,
    Siren,
} from "lucide-react";
import Link from "next/link";
import type { Environment } from "@/lib/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

type AppItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  color?: string;
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
    | 'canUseMessaging';
  isSuperAdminOnly?: boolean;
};

const appItems: AppItem[] = [
  { href: "/stock", label: "Inventaire", icon: Warehouse, color: "text-purple-500", permission: 'canViewStock' },
  { href: "/articles", label: "Articles", icon: Archive, color: "text-orange-500", permission: 'canViewStock'},
  { href: "/flux-entrant", label: "Achats", icon: ArrowDownToLine, color: "text-sky-500", permission: 'canCreateBC' },
  { href: "/flux-sortant", label: "Ventes", icon: ArrowUpFromLine, color: "text-red-500", permission: 'canCreateBL' },
  { href: "/tiers", label: "Tiers", icon: Users, color: "text-green-500", permission: 'canViewTiers' },
  { href: "/documents", label: "Documents", icon: FileText, color: "text-indigo-500", permission: 'canViewDashboard' },
  { href: "/messaging", label: "Messagerie", icon: Mail, color: "text-blue-500", permission: 'canUseMessaging' },
  { href: "/classes", label: "Classes", icon: BookUser, color: "text-amber-500", isSuperAdminOnly: true, permission: 'canManageClasses' },
];

function AppCard({ item }: { item: AppItem }) {
  return (
    <Link href={item.href} className="group block">
      <Card className="h-full bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-black/30 hover:bg-white/70 dark:hover:bg-black/70 transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4 h-full">
          <div className="bg-primary/10 p-4 rounded-full">
            <item.icon className={`h-8 w-8 ${item.color || 'text-primary'}`} />
          </div>
          <p className="font-semibold text-foreground">{item.label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function KpiCard({ title, value, icon: Icon, color, onClick }: { title: string, value: number, icon: React.ElementType, color: string, onClick?: () => void }) {
    const isClickable = !!onClick;
    return (
        <Card onClick={onClick} className={isClickable ? "cursor-pointer hover:bg-muted" : ""}>
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

function SystemAlerts() {
    const { state } = useWms();
    const { articles, currentEnvironmentId, currentUserPermissions } = state;

    // Only show for relevant roles
    if (!currentUserPermissions?.canCreateBC && !currentUserPermissions?.canViewStock) {
        return null;
    }

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
                        <Package className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Rupture de Stock</AlertTitle>
                        <AlertDescription>
                            <Link href="/articles" className="underline">{outOfStockArticles} article(s)</Link> sont en rupture de stock.
                        </AlertDescription>
                    </Alert>
                )}
                {lowStockArticles > 0 && (
                     <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Stock Faible</AlertTitle>
                        <AlertDescription>
                           <Link href="/articles" className="underline">{lowStockArticles} article(s)</Link> sont sous le seuil d'alerte (moins de 5 unités).
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

export function DashboardClient() {
  const { state } = useWms();
  const router = useRouter();
  const { currentUser, currentUserPermissions, environments, currentEnvironmentId, documents, articles } = state;

  if (!currentUser || !currentUserPermissions) {
    return null; // Or a loading spinner
  }

  const currentEnv = environments.get(currentEnvironmentId);

  const visibleAppItems = appItems.filter(item => {
    if (item.isSuperAdminOnly && !currentUserPermissions.isSuperAdmin) {
        return false;
    }
    if (item.permission && !currentUserPermissions[item.permission]) {
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

  const showSystemAlerts = currentUser?.profile === 'professeur' || currentUser?.profile === 'Administrateur' || currentUserPermissions.canCreateBC;

  const kpiItems = [
    { title: "BC en attente de réception", value: pendingPOs, icon: ArrowDownToLine, color: "text-sky-500", show: currentUserPermissions.canReceiveBC, onClick: () => router.push('/flux-entrant?tab=receive') },
    { title: "BL en attente de préparation", value: pendingSOs, icon: ArrowUpFromLine, color: "text-red-500", show: currentUserPermissions.canPrepareBL, onClick: () => router.push('/flux-sortant?tab=prepare') },
    { title: "Articles en Stock", value: articlesInStock, icon: Package, color: "text-purple-500", show: currentUserPermissions.canViewStock, onClick: () => router.push('/articles') },
    { title: "Retours à traiter", value: pendingReturns, icon: RotateCcw, color: "text-orange-500", show: currentUserPermissions.canReceiveBC, onClick: () => router.push('/flux-entrant?tab=returns') },
  ].filter(kpi => kpi.show);


  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Bonjour, {currentUser?.username} !</h1>
            <p className="text-muted-foreground">Bienvenue dans votre espace {currentEnv?.name}. Choisissez une application pour commencer.</p>
        </div>

        {showSystemAlerts && <SystemAlerts />}

        {kpiItems.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpiItems.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {visibleAppItems.map((item) => (
                <AppCard key={item.href} item={item} />
            ))}
        </div>
    </div>
  );
}
