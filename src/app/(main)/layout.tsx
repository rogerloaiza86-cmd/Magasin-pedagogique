"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  BrainCircuit,
  Boxes,
  LogOut,
  FileText,
  BookUser,
  Mail,
  Swords,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useWms } from "@/context/WmsContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: 
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
    | 'canManageScenarios';
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, permission: 'canViewDashboard' },
  { href: "/scenarios", label: "Scénarios", icon: Swords, permission: 'canManageScenarios'},
  { href: "/tiers", label: "Gestion des Tiers", icon: Users, permission: 'canViewTiers' },
  { href: "/flux-entrant", label: "Flux Entrant", icon: ArrowDownToLine, permission: 'canCreateBC' }, // Simplified for grouping
  { href: "/flux-sortant", label: "Flux Sortant", icon: ArrowUpFromLine, permission: 'canCreateBL' }, // Simplified for grouping
  { href: "/stock", label: "Gestion des Stocks", icon: Warehouse, permission: 'canViewStock' },
  { href: "/documents", label: "Documents", icon: FileText, permission: 'canViewDashboard' }, // Everyone can see their docs
  { href: "/messaging", label: "Messagerie", icon: Mail, permission: 'canUseMessaging' },
  { href: "/classes", label: "Gestion des Classes", icon: BookUser, permission: 'canManageClasses' },
  { href: "/ia-tools", label: "Outils d'IA", icon: BrainCircuit, permission: 'canUseIaTools' },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { state, dispatch } = useWms();
  const { currentUser, currentUserPermissions, emails, roles } = state;

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };
  
  const userInitials = currentUser?.username.substring(0, 2).toUpperCase() || '??';

  const visibleNavItems = navItems.filter(item => {
    if (!currentUserPermissions) return false;

    // Special logic for grouped menus
    if (item.href === "/flux-entrant") {
      return currentUserPermissions.canCreateBC || currentUserPermissions.canReceiveBC;
    }
    if (item.href === "/flux-sortant") {
      return currentUserPermissions.canCreateBL || currentUserPermissions.canPrepareBL || currentUserPermissions.canShipBL;
    }

    return currentUserPermissions[item.permission];
  });

  const unreadMessages = Array.from(emails.values()).filter(email => email.recipient === currentUser?.username && !email.isRead).length;


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Boxes className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Magasin Pédagogique</h1>
                <p className="text-xs text-muted-foreground">Lycée Gaspard Monge</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                    >
                      <div className="relative">
                        <item.icon />
                        <span>{item.label}</span>
                        {item.href === '/messaging' && currentUserPermissions?.canUseMessaging && unreadMessages > 0 && (
                           <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                              {unreadMessages}
                            </span>
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <div className="flex items-center gap-2 p-2">
                <Avatar>
                    <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold truncate">{currentUser?.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{roles.get(currentUser?.roleId || '')?.name || currentUser?.profile}</p>
                </div>
                <Link href="/login" onClick={handleLogout}>
                    <SidebarMenuButton tooltip="Se déconnecter" className="w-auto">
                        <LogOut />
                    </SidebarMenuButton>
                </Link>
             </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
