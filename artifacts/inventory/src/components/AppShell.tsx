import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import { LayoutDashboard, Package, Activity, LogOut, PackageOpen } from 'lucide-react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    setLocation('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Movements', path: '/movements', icon: Activity },
  ];

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-sidebar-border">
        <SidebarHeader className="py-4 px-4 h-16 flex justify-center">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <PackageOpen className="h-6 w-6" />
            <span className="font-bold text-lg tracking-tight">StockCockpit</span>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      isActive={location === item.path || (item.path !== '/' && location.startsWith(item.path))}
                      onClick={() => setLocation(item.path)}
                      className="font-medium"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="w-full justify-start border border-sidebar-border bg-sidebar-accent/50 p-2 rounded-lg">
                <Avatar className="h-8 w-8 rounded-md bg-primary/20">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left ml-2 flex-1 overflow-hidden">
                  <span className="text-sm font-semibold truncate w-full">{user?.name}</span>
                  <span className="text-xs text-muted-foreground truncate w-full flex items-center gap-1">
                    {user?.role === 'admin' ? (
                      <Badge variant="default" className="h-4 text-[10px] px-1 py-0 shadow-none">Admin</Badge>
                    ) : (
                      <Badge variant="secondary" className="h-4 text-[10px] px-1 py-0 shadow-none">Viewer</Badge>
                    )}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex flex-col h-screen overflow-hidden bg-muted/30">
        <header className="h-16 flex items-center px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 sticky top-0 border-b shadow-sm">
          <SidebarTrigger className="-ml-1 mr-2" />
          <Separator orientation="vertical" className="h-6 mr-4" />
          <h1 className="font-semibold text-lg tracking-tight">Warehouse Main</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
