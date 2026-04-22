import { Switch, Route, Router as WouterRouter } from "wouter";
import { Provider } from "react-redux";
import { store } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import ProductForm from "@/pages/ProductForm";
import ProductDetail from "@/pages/ProductDetail";
import Movements from "@/pages/Movements";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <RequireAuth>
          <AppShell>
            <Dashboard />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/products">
        <RequireAuth>
          <AppShell>
            <Products />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/products/new">
        <RequireAuth>
          <AppShell>
            <ProductForm />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/products/:id/edit">
        <RequireAuth>
          <AppShell>
            <ProductForm />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/products/:id">
        <RequireAuth>
          <AppShell>
            <ProductDetail />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/movements">
        <RequireAuth>
          <AppShell>
            <Movements />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route>
        <RequireAuth>
          <AppShell>
            <NotFound />
          </AppShell>
        </RequireAuth>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <Provider store={store}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </Provider>
  );
}

export default App;
