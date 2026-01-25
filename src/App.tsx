import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PushChainProvider } from "@/contexts/PushChainContext";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { AIChatBot } from "@/components/AIChatBot";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Liquidity = lazy(() => import("./pages/Liquidity"));
const Pools = lazy(() => import("./pages/Pools"));
const PoolDetail = lazy(() => import("./pages/PoolDetail"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const CreatePool = lazy(() => import("./pages/CreatePool"));
const History = lazy(() => import("./pages/History"));
const Farming = lazy(() => import("./pages/Farming"));
const Staking = lazy(() => import("./pages/Staking"));
const Docs = lazy(() => import("./pages/Docs"));
const PushChainDocs = lazy(() => import("./pages/PushChainDocs"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
        <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading PUSHDEX...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PushChainProvider>
      <TooltipProvider delayDuration={200}>
        <Toaster />
        <Sonner position="top-right" theme="dark" richColors closeButton />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/liquidity" element={<Liquidity />} />
              <Route path="/pools" element={<Pools />} />
              <Route path="/pools/create" element={<CreatePool />} />
              <Route path="/pools/:address" element={<PoolDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/history" element={<History />} />
              <Route path="/farming" element={<Farming />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/pushchain-docs" element={<PushChainDocs />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          {/* AI ChatBot - Available on all pages */}
          <AIChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </PushChainProvider>
  </QueryClientProvider>
);

export default App;
