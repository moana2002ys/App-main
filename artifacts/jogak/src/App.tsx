import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useAppStore } from "@/lib/store";
import { PhoneFrame } from "@/components/PhoneFrame";

import { Auth } from "@/pages/auth";
import { Onboarding } from "@/pages/onboarding";
import { DailyCheckin } from "@/pages/daily-checkin";
import { Home } from "@/pages/home";
import { Reflection } from "@/pages/reflection";
import { Growth } from "@/pages/growth";

const queryClient = new QueryClient();

function MainFlow() {
  const { view } = useAppStore();

  return (
    <PhoneFrame>
      {view === 'auth' && <Auth />}
      {view === 'onboarding' && <Onboarding />}
      {view === 'daily_checkin' && <DailyCheckin />}
      {view === 'home' && <Home />}
      {view === 'reflection' && <Reflection />}
      {view === 'growth' && <Growth />}
    </PhoneFrame>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <MainFlow />
        </AppProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
