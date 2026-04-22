import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGetProductQuery, useCreateProductMutation, useUpdateProductMutation } from '@/store/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { RequireRole } from '@/components/RequireRole';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be positive'),
  lowStockThreshold: z.coerce.number().int().min(0, 'Threshold must be positive'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductForm() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = !params.id || params.id === 'new';

  const { data: product, isLoading: isFetching } = useGetProductQuery(params.id, {
    skip: isNew,
  });

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const isSaving = isCreating || isUpdating;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      description: '',
      price: 0,
      quantity: 0,
      lowStockThreshold: 10,
    },
  });

  useEffect(() => {
    if (product && !isNew) {
      form.reset({
        name: product.name,
        sku: product.sku,
        category: product.category || '',
        description: product.description || '',
        price: product.price,
        quantity: product.quantity,
        lowStockThreshold: product.lowStockThreshold,
      });
    }
  }, [product, isNew, form]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (isNew) {
        const newProduct = await createProduct(data).unwrap();
        toast.success('Product created successfully');
        setLocation(`/products/${newProduct.id}`);
      } else {
        await updateProduct({ id: params.id, ...data }).unwrap();
        toast.success('Product updated successfully');
        setLocation(`/products/${params.id}`);
      }
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to save product');
      if (err.data?.errors) {
        err.data.errors.forEach((e: any) => {
          form.setError(e.path as any, { message: e.message });
        });
      }
    }
  };

  if (isFetching) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <RequireRole role="admin">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation(isNew ? '/products' : `/products/${params.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isNew ? 'New Product' : 'Edit Product'}</h1>
            <p className="text-muted-foreground">{isNew ? 'Add a new product to your inventory catalog.' : `Update details for ${product?.name}`}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Widget" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. WIDG-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Electronics" {...field} />
                        </FormControl>
                        <FormDescription>Group similar products together.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" min="0" disabled={!isNew} {...field} />
                        </FormControl>
                        {!isNew && <FormDescription>Use "Adjust Stock" on the product page to change existing inventory.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Stock Alert Threshold</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" min="0" {...field} />
                        </FormControl>
                        <FormDescription>Alert when stock falls below this number.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed product description..." 
                          className="min-h-[100px] resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => setLocation(isNew ? '/products' : `/products/${params.id}`)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {isNew ? 'Create Product' : 'Save Changes'}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
