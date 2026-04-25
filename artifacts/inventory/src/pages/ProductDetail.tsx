import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetProductQuery, useGetMovementsQuery, useCreateMovementMutation, useDeleteProductMutation } from '@/store/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Edit, ArrowUpDown, Trash2, ArrowUpRight, ArrowDownRight, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/apiError';

export default function ProductDetail() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';

  const { data: product, isLoading: productLoading, isError: productError } = useGetProductQuery(params.id);
  const { data: movementsData, isLoading: movementsLoading } = useGetMovementsQuery({ productId: params.id, limit: 10 });
  const [deleteProduct] = useDeleteProductMutation();

  const [adjustOpen, setAdjustOpen] = useState(false);

  if (productLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (productError || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The product you are looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => setLocation('/products')}>Return to Products</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${product.name}? This action cannot be undone.`)) {
      try {
        await deleteProduct(product.id).unwrap();
        toast.success(`Deleted ${product.name}`);
        setLocation('/products');
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, 'Failed to delete product'));
      }
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.isLowStock && <Badge variant="destructive">Low Stock</Badge>}
          </div>
          <p className="text-muted-foreground font-mono mt-1">SKU: {product.sku}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLocation(`/products/${product.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button onClick={() => setAdjustOpen(true)}>
              <ArrowUpDown className="h-4 w-4 mr-2" /> Adjust Stock
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
                <div className="font-medium mt-1">{product.category || 'Uncategorized'}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Unit Price</Label>
                <div className="font-medium text-lg mt-1">{formatCurrency(product.price)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
                <div className="text-sm mt-1 leading-relaxed">
                  {product.description || <span className="italic text-muted-foreground">No description provided.</span>}
                </div>
              </div>
              <div className="pt-4 border-t">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Created</Label>
                <div className="text-sm mt-1">{format(new Date(product.createdAt), 'PPpp')}</div>
              </div>
            </CardContent>
          </Card>

          <Card className={product.isLowStock ? 'border-destructive/50 bg-destructive/5' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                Current Stock
                <Package className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight flex items-baseline gap-2">
                <span className={product.isLowStock ? 'text-destructive' : ''}>{product.quantity}</span>
                <span className="text-sm font-normal text-muted-foreground">units</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Minimum threshold: <strong>{product.lowStockThreshold}</strong>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <Button variant="destructive" className="w-full" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Product
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Movement History</CardTitle>
              <CardDescription>Recent stock changes for this product.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : movementsData?.items?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No movements recorded yet.</TableCell></TableRow>
                  ) : (
                    movementsData?.items?.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <Badge variant={movement.type === 'IN' ? 'default' : 'secondary'} className={`flex w-fit items-center gap-1 ${movement.type === 'IN' ? 'bg-emerald-600' : ''}`}>
                            {movement.type === 'IN' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div title={format(new Date(movement.createdAt), 'PPpp')}>
                            {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={movement.note}>
                          {movement.note || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdmin && <AdjustStockDialog product={product} open={adjustOpen} onOpenChange={setAdjustOpen} />}
    </div>
  );
}

function AdjustStockDialog({ product, open, onOpenChange }: { product: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [type, setType] = useState<'IN'|'OUT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  
  const [createMovement, { isLoading }] = useCreateMovementMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be a positive integer.");
      return;
    }
    
    try {
      await createMovement({ productId: product.id, type, quantity: qty, note }).unwrap();
      toast.success(`Successfully recorded stock ${type}.`);
      onOpenChange(false);
      setQuantity('1');
      setNote('');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to record movement.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock for {product.name}</DialogTitle>
          <DialogDescription>Record a stock movement to update the inventory count.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select value={type} onValueChange={(v: 'IN'|'OUT') => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock IN (+)</SelectItem>
                  <SelectItem value="OUT">Stock OUT (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note (Optional)</Label>
            <Textarea 
              placeholder="Reason for adjustment (e.g. Restock from PO-1234, Damaged goods)" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
            />
          </div>
          
          {type === 'OUT' && parseInt(quantity, 10) > product.quantity && (
            <div className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded border border-destructive/20">
              This adjustment exceeds current stock and will be rejected.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
