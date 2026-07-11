import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Character from "@/pages/character";
import Room from "@/pages/room";
import { Navigation } from "@/components/Navigation";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-[100dvh] pb-[72px]">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/character" component={Character} />
        <Route path="/room" component={Room} />
        <Route component={NotFound} />
      </Switch>
      <Navigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
