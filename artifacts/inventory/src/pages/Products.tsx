import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetProductsQuery, useGetCategoriesQuery, useDeleteProductMutation } from '@/store/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Plus, Search, FilterX, Eye, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/apiError';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Products() {
  const [location, setLocation] = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<string>('_all');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('name');
  
  const { data: categoriesData } = useGetCategoriesQuery(undefined);
  const { data: productsData, isLoading, isFetching } = useGetProductsQuery({
    search: debouncedSearch,
    category: category === '_all' ? '' : category,
    lowStock,
    page,
    limit: 10,
    sort,
  });

  const [deleteProduct] = useDeleteProductMutation();

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await deleteProduct(id).unwrap();
        toast.success(`Deleted ${name}`);
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, 'Failed to delete product'));
      }
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('_all');
    setLowStock(false);
    setPage(1);
    setSort('name');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your warehouse inventory catalog.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setLocation('/products/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-[180px]">
                <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Categories</SelectItem>
                    {categoriesData?.items?.map((cat: string) => (
                      <SelectItem key={cat || 'uncategorized'} value={cat || 'uncategorized'}>
                        {cat || 'Uncategorized'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[180px]">
                <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="-name">Name (Z-A)</SelectItem>
                    <SelectItem value="price">Price (Low to High)</SelectItem>
                    <SelectItem value="-price">Price (High to Low)</SelectItem>
                    <SelectItem value="quantity">Stock (Low to High)</SelectItem>
                    <SelectItem value="-quantity">Stock (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 border rounded-md px-3 h-9">
                <Switch id="low-stock" checked={lowStock} onCheckedChange={(c) => { setLowStock(c); setPage(1); }} />
                <Label htmlFor="low-stock" className="text-sm cursor-pointer">Low Stock Only</Label>
              </div>

              <Button variant="ghost" size="icon" onClick={handleClearFilters} title="Clear Filters">
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : productsData?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  productsData?.items?.map((product: any) => (
                    <TableRow key={product.id} className="cursor-pointer group" onClick={() => setLocation(`/products/${product.id}`)}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{product.category || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-bold ${product.isLowStock ? 'text-destructive' : ''}`}>{product.quantity}</span>
                          {product.isLowStock && (
                            <Badge variant="destructive" className="h-4 text-[10px] px-1 py-0 shadow-none">Low</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/products/${product.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => setLocation(`/products/${product.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteProduct(product.id).unwrap().then(()=>toast.success("Deleted")).catch(()=>toast.error("Failed"))} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {productsData?.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing page {productsData.page} of {productsData.totalPages}
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
                  onClick={() => setPage(p => Math.min(productsData.totalPages, p + 1))}
                  disabled={page === productsData.totalPages || isLoading || isFetching}
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
