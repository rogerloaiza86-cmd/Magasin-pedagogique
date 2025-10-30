
"use client";

import { useWms } from "@/context/WmsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Home,
    Users,
    Warehouse,
    ArrowDownToLine,
    ArrowUpFromLine,
    BrainCircuit,
    Boxes,
    FileText,
    BookUser,
    Mail,
    Swords,
    Truck,
    Archive
} from "lucide-react";
import Link from "next/link";
import type { Environment } from "@/lib/types";

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
    | 'canManageFleet';
  envType: Environment['type'] | 'ALL';
  isSuperAdminOnly?: boolean;
};

const appItems: AppItem[] = [
  { href: "/stock", label: "Inventaire", icon: Warehouse, color: "text-purple-500", permission: 'canViewStock', envType: 'WMS' },
  { href: "/articles", label: "Articles", icon: Archive, color: "text-orange-500", permission: 'canViewStock', envType: 'WMS'},
  { href: "/flux-entrant", label: "Achats", icon: ArrowDownToLine, color: "text-sky-500", permission: 'canCreateBC', envType: 'WMS' },
  { href: "/flux-sortant", label: "Ventes", icon: ArrowUpFromLine, color: "text-red-500", permission: 'canCreateBL', envType: 'WMS' },
  { href: "/tiers", label: "Tiers", icon: Users, color: "text-green-500", permission: 'canViewTiers', envType: 'ALL' },
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

export function DashboardClient() {
  const { state } = useWms();
  const { currentUser, currentUserPermissions, environments, currentEnvironmentId } = state;
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

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Bonjour, {currentUser?.username} !</h1>
            <p className="text-muted-foreground">Bienvenue dans votre espace {currentEnv?.name}. Choisissez une application pour commencer.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {visibleAppItems.map((item) => (
                <AppCard key={item.href} item={item} />
            ))}
        </div>
    </div>
  );
}
