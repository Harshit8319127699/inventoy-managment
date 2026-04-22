import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api';
import { setUser, logout } from '@/store/authSlice';
import { Skeleton } from './ui/skeleton';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  const { data: meData, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !isAuthenticated || !token,
  });

  useEffect(() => {
    if (isError) {
      dispatch(logout());
    }
  }, [isError, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLocation('/login');
    }
  }, [isAuthenticated, token, setLocation]);

  useEffect(() => {
    if (meData?.user) {
      dispatch(setUser(meData.user));
    }
  }, [meData, dispatch]);

  if (!isAuthenticated || !token) {
    return null;
  }

  if (!user || isLoading) {
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
