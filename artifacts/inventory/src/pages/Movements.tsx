import { useState } from 'react';
import { Link } from 'wouter';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetMovementsQuery } from '@/store/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, FilterX, Activity } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function Movements() {
  const [type, setType] = useState<string>('_all');
  const [page, setPage] = useState(1);

  const { data: movementsData, isLoading, isFetching } = useGetMovementsQuery({
    type: type === '_all' ? '' : type,
    page,
    limit: 15,
  });

  const handleClearFilters = () => {
    setType('_all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">Log of all inventory changes across the warehouse.</p>
        </div>
        {/* Record movement button is handled from Product Detail mostly, but could have a global one if we had a product picker */}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-2 rounded-lg border">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Activity className="h-4 w-4 text-muted-foreground ml-2" />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                  <SelectValue placeholder="Movement Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Movements</SelectItem>
                  <SelectItem value="IN">Stock IN (+)</SelectItem>
                  <SelectItem value="OUT">Stock OUT (-)</SelectItem>
                </SelectContent>
              </Select>
              {(type !== '_all') && (
                <Button variant="ghost" size="icon" onClick={handleClearFilters} title="Clear Filters" className="shrink-0">
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="hidden md:table-cell w-[30%]">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : movementsData?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No movements found matching the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  movementsData?.items?.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium" title={format(new Date(movement.createdAt), 'PPpp')}>
                          {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground md:hidden truncate max-w-[150px] mt-1">
                          {movement.note}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.type === 'IN' ? 'default' : 'secondary'} className={`flex w-fit items-center gap-1 ${movement.type === 'IN' ? 'bg-emerald-600' : ''}`}>
                          {movement.type === 'IN' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {movement.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/products/${movement.product.id}`} className="font-medium hover:underline decoration-primary underline-offset-4">
                          {movement.product.name}
                        </Link>
                        <div className="text-xs text-muted-foreground font-mono">{movement.product.sku}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        <span className={movement.type === 'IN' ? 'text-emerald-600' : ''}>
                          {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {movement.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {movementsData?.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing page {movementsData.page} of {movementsData.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading || isFetching}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(movementsData.totalPages, p + 1))}
                  disabled={page === movementsData.totalPages || isLoading || isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
