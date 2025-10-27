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
  Badge,
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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, profiles: ["élève", "professeur", "Administrateur"] },
  { href: "/tiers", label: "Gestion des Tiers", icon: Users, profiles: ["élève", "professeur", "Administrateur"] },
  { href: "/flux-entrant", label: "Flux Entrant", icon: ArrowDownToLine, profiles: ["élève", "professeur", "Administrateur"] },
  { href: "/flux-sortant", label: "Flux Sortant", icon: ArrowUpFromLine, profiles: ["élève", "professeur", "Administrateur"] },
  { href: "/stock", label: "Gestion des Stocks", icon: Warehouse, profiles: ["élève", "professeur", "Administrateur"] },
  { href: "/ia-tools", label: "Outils d'IA", icon: BrainCircuit, profiles: ["professeur", "Administrateur"] },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { state, dispatch } = useWms();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };
  
  const userInitials = state.currentUser?.username.substring(0, 2).toUpperCase() || '??';
  const visibleNavItems = navItems.filter(item => state.currentUser && item.profiles.includes(state.currentUser.profile));

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
                      <div>
                        <item.icon />
                        <span>{item.label}</span>
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
                    <p className="text-sm font-semibold truncate">{state.currentUser?.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{state.currentUser?.profile}</p>
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
