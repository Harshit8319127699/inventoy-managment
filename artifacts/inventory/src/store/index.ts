import { configureStore, isRejectedWithValue, Middleware } from '@reduxjs/toolkit';
import { api } from './api';
import authReducer, { logout } from './authSlice';
import { toast } from 'sonner';

export const rtkQueryErrorLogger: Middleware = (api) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload as { status?: number } | undefined;
    if (payload?.status === 401) {
      api.dispatch(logout());
      toast.error('Session expired. Please log in again.');
    }
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, rtkQueryErrorLogger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
