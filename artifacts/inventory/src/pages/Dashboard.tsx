import { useGetDashboardSummaryQuery } from '@/store/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, Layers, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useGetDashboardSummaryQuery(undefined, {
    pollingInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !summary) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-2">
          <Activity className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
          <p className="text-muted-foreground">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  // Format chart data
  const chartData = summary.movementsByDay?.reduce((acc: any[], curr: any) => {
    const existing = acc.find(item => item.day === curr.day);
    if (existing) {
      if (curr.type === 'IN') existing.IN = curr.quantity;
      if (curr.type === 'OUT') existing.OUT = curr.quantity;
    } else {
      acc.push({
        day: curr.day,
        IN: curr.type === 'IN' ? curr.quantity : 0,
        OUT: curr.type === 'OUT' ? curr.quantity : 0,
      });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your warehouse stock and recent activity.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Products" 
          value={summary.totalProducts.toLocaleString()} 
          icon={Package} 
          delay={0.1} 
        />
        <KPICard 
          title="Units in Stock" 
          value={summary.totalUnits.toLocaleString()} 
          icon={Layers} 
          delay={0.2} 
        />
        <KPICard 
          title="Total Value" 
          value={formatCurrency(summary.totalStockValue)} 
          icon={DollarSign} 
          delay={0.3} 
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className={summary.lowStockCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${summary.lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.lowStockCount > 0 ? 'text-destructive' : ''}`}>
                {summary.lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                items below threshold
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Chart */}
        <Card className="md:col-span-4 lg:col-span-5 shadow-sm">
          <CardHeader>
            <CardTitle>Stock Movements (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="IN" name="Stock In" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="OUT" name="Stock Out" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No movements recorded in the last 14 days.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock List */}
        <Card className="md:col-span-3 lg:col-span-2 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-destructive/5 pb-4 border-b border-destructive/10">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[300px]">
            {summary.lowStockItems?.length > 0 ? (
              <div className="divide-y">
                {summary.lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium text-sm leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-destructive">{item.quantity}</div>
                      <div className="text-[10px] text-muted-foreground">/ {item.lowStockThreshold} min</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <p>All stock levels are healthy.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Movements */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.recentMovements?.length > 0 ? (
              <div className="divide-y">
                {summary.recentMovements.map((movement: any) => (
                  <div key={movement.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${movement.type === 'IN' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'}`}>
                      {movement.type === 'IN' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {movement.product.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="font-mono">{movement.product.sku}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={movement.type === 'IN' ? 'default' : 'secondary'} className={movement.type === 'IN' ? 'bg-emerald-600' : ''}>
                        {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No recent activity.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.categories?.length > 0 ? (
              <div className="space-y-4">
                {summary.categories.map((cat: any, index: number) => (
                  <div key={cat.category || 'Uncategorized'} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium truncate" title={cat.category || 'Uncategorized'}>
                      {cat.category || 'Uncategorized'}
                    </div>
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ 
                          width: `${Math.max(1, (cat.count / summary.totalProducts) * 100)}%`,
                          backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))`
                        }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-muted-foreground font-mono">
                      {cat.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No categories found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, delay }: { title: string, value: string, icon: any, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground/50" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
        </Card>
        <Card className="md:col-span-3 lg:col-span-2">
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
