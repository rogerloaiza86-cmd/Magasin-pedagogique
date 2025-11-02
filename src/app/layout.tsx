
"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  LogOut,
  FileText,
  BookUser,
  Mail,
  Archive,
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
import { WmsProvider } from '@/context/WmsContext';
import { Toaster } from '@/components/ui/toaster';
import { AppStateSync } from '@/components/AppStateSync';
import { Logo } from "@/components/Logo";


type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
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

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, permission: 'canViewDashboard' },
  { href: "/articles", label: "Fichier Articles", icon: Archive, permission: 'canViewStock'},
  { href: "/tiers", label: "Gestion des Tiers", icon: Users, permission: 'canViewTiers' },
  { href: "/flux-entrant", label: "Flux Entrant", icon: ArrowDownToLine, permission: 'canCreateBC' },
  { href: "/flux-sortant", label: "Flux Sortant", icon: ArrowUpFromLine, permission: 'canCreateBL' },
  { href: "/stock", label: "Gestion des Stocks", icon: Warehouse, permission: 'canViewStock' },
  { href: "/documents", label: "Documents", icon: FileText, permission: 'canViewDashboard' },
  { href: "/messaging", label: "Messagerie", icon: Mail, permission: 'canUseMessaging' },
  { href: "/classes", label: "Gestion des Classes", icon: BookUser, permission: 'canManageClasses' },
];

function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { state, dispatch } = useWms();
  const { currentUser, currentUserPermissions, emails, roles, environments, currentEnvironmentId } = state;
  const currentEnv = environments.get(currentEnvironmentId);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };
  
  const userInitials = currentUser?.username.substring(0, 2).toUpperCase() || '??';

  const visibleNavItems = navItems.filter(item => {
    if (!currentUserPermissions) return false;

    // Hide for non-super-admin if required
    if (item.isSuperAdminOnly && !currentUserPermissions.isSuperAdmin) {
        return false;
    }
    
    // Special logic for grouped menus
    if (item.href === "/flux-entrant") {
      return currentUserPermissions.canCreateBC || currentUserPermissions.canReceiveBC;
    }
    if (item.href === "/flux-sortant") {
      return currentUserPermissions.canCreateBL || currentUserPermissions.canPrepareBL || currentUserPermissions.canShipBL;
    }
    
    // Check for general permission if it exists
    if (item.permission && !currentUserPermissions[item.permission]) {
        return false;
    }

    return true;
  });

  const unreadMessages = Array.from(emails.values()).filter(email => email.recipient === currentUser?.username && !email.isRead).length;


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Logo className="h-10 w-10" />
              <div>
                <h1 className="text-sm font-bold">Lycée Polyvalent</h1>
                <p className="text-xs text-muted-foreground">GASPARD MONGE</p>
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <html lang="fr">
      <body className={'font-body antialiased'}>
        <WmsProvider>
          <AppStateSync />
            {isAuthPage ? (
              children
            ) : (
              <MainLayout>{children}</MainLayout>
            )}
          <Toaster />
        </WmsProvider>
      </body>
    </html>
  );
}
