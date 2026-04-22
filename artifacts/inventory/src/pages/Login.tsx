import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import { api, useLoginMutation } from '@/store/api';
import { setCredentials } from '@/store/authSlice';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageOpen, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [login, { isLoading, error }] = useLoginMutation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(api.util.resetApiState());
      dispatch(setCredentials({ token: result.token, user: result.user }));
      setLocation('/');
    } catch (err) {
      // Error handled by RTK Query / UI
    }
  };

  const autofill = (role: 'admin' | 'viewer') => {
    setEmail(`${role}@warehouse.local`);
    setPassword(`${role}123`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8 space-y-2">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <PackageOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">StockCockpit</h1>
          <p className="text-muted-foreground text-sm">Warehouse Inventory Management</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the system.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 text-destructive border-none">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {(error as any)?.data?.message || 'Invalid email or password. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@warehouse.local" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Sign In
              </Button>

              <div className="w-full bg-secondary/50 rounded-lg p-4 border text-sm space-y-2">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Demo Credentials</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => autofill('admin')} className="w-full h-auto py-2 flex flex-col items-start gap-1">
                    <span className="font-semibold">Admin</span>
                    <span className="text-[10px] text-muted-foreground font-mono">admin@...</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => autofill('viewer')} className="w-full h-auto py-2 flex flex-col items-start gap-1">
                    <span className="font-semibold">Viewer</span>
                    <span className="text-[10px] text-muted-foreground font-mono">viewer@...</span>
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
