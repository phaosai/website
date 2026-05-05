import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Microscope, Sparkles, ListChecks, FlaskConical, Workflow,
  Users, ShieldAlert, Receipt, Settings, Lock, Crown, Hammer,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useEntitlements, type Tier } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
  min: Tier;
}

const ITEMS: NavItem[] = [
  { title: "Command Center", url: "/app", icon: Home, min: "free" },
  { title: "Foundry", url: "/app/foundry", icon: Hammer, min: "free" },
  { title: "Sunesis", url: "/app/sunesis", icon: Microscope, min: "sunesis" },
  { title: "Investment Themes", url: "/app/themes", icon: Sparkles, min: "sunesis" },
  { title: "Watchlists", url: "/app/watchlists", icon: ListChecks, min: "free" },
  { title: "Simulations", url: "/app/simulations", icon: FlaskConical, min: "aion" },
  { title: "Kyrios", url: "/app/kyrios", icon: Workflow, min: "kyrios" },
  { title: "Client Portals", url: "/app/portals", icon: Users, min: "kyrios" },
  { title: "Aion", url: "/app/aion", icon: ShieldAlert, min: "aion" },
  { title: "Pantheon", url: "/app/pantheon", icon: Crown, min: "pantheon" },
  { title: "Billing", url: "/app/billing", icon: Receipt, min: "free" },
  { title: "Settings", url: "/app/settings", icon: Settings, min: "free" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const ent = useEntitlements();

  const isActive = (url: string) => url === "/app" ? pathname === "/app" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-purple-deep/15 flex items-center justify-center">
              <Crown className="w-4 h-4 text-purple-deep" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-foreground">Phaos <span className="italic text-purple-deep font-medium">AI</span></p>
              <p className="text-[10px] text-muted-foreground">{ent.productLabel}</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map((item) => {
                const unlocked = ent.has(item.min);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild={unlocked}
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className={cn(!unlocked && "opacity-60")}
                    >
                      {unlocked ? (
                        <NavLink to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      ) : (
                        <NavLink to="/pricing" className="flex items-center gap-2" title={`Requires ${item.min}`}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span className="flex-1 flex items-center justify-between">
                              {item.title}
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </span>
                          )}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && ent.tier === "free" && (
          <NavLink to="/pricing" className="block text-center text-xs px-3 py-2 rounded-md bg-purple-deep text-white hover:bg-purple-deep/90">
            Upgrade plan
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
