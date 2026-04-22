import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api';
import { setUser } from '@/store/authSlice';
import { useDispatch } from 'react-redux';
import { Skeleton } from './ui/skeleton';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const { data: meData, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated || !token || isError) {
      setLocation('/login');
    }
  }, [isAuthenticated, token, isError, setLocation]);

  useEffect(() => {
    if (meData?.user) {
      dispatch(setUser(meData.user));
    }
  }, [meData, dispatch]);

  if (isLoading || !meData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center flex flex-col items-center">
           <Skeleton className="h-12 w-12 rounded-full" />
           <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
