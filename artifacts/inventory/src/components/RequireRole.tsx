import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent } from './ui/card';
import { ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';
import { useLocation } from 'wouter';

export function RequireRole({ children, role }: { children: React.ReactNode; role: string }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [, setLocation] = useLocation();

  if (user?.role !== role && user?.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              You don't have the necessary permissions to view this page. This area requires <strong>{role}</strong> access.
            </p>
            <Button className="mt-4" onClick={() => setLocation('/')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
