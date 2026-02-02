import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PushChainProvider } from "@/contexts/PushChainContext";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AIChatBot } from "@/components/AIChatBot";
import { SkipLink, LiveRegion } from "@/components/AccessibleSkipLink";
import { AnimatePresence, motion } from "framer-motion";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
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

// Loading component for Suspense fallback with accessibility
const PageLoader = () => (
  <div 
    className="min-h-screen flex items-center justify-center bg-background"
    role="progressbar"
    aria-label="Loading page"
    aria-busy="true"
  >
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
        <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading PUSHDEX...</p>
    </div>
  </div>
);

// Page transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {children}
    </motion.div>
  );
};

// Animated Routes component
const AnimatedRoutes = () => {
  const location = useLocation();

  // Announce page changes to screen readers
  useEffect(() => {
    const pageTitle = document.title;
    const announcement = `Navigated to ${pageTitle}`;
    // The live region will announce this
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/swap" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/liquidity" element={<PageTransition><Liquidity /></PageTransition>} />
        <Route path="/pools" element={<PageTransition><Pools /></PageTransition>} />
        <Route path="/pools/create" element={<PageTransition><CreatePool /></PageTransition>} />
        <Route path="/pools/:address" element={<PageTransition><PoolDetail /></PageTransition>} />
        <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
        <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
        <Route path="/history" element={<PageTransition><History /></PageTransition>} />
        <Route path="/farming" element={<PageTransition><Farming /></PageTransition>} />
        <Route path="/staking" element={<PageTransition><Staking /></PageTransition>} />
        <Route path="/docs" element={<PageTransition><Docs /></PageTransition>} />
        <Route path="/pushchain-docs" element={<PageTransition><PushChainDocs /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PushChainProvider>
      <TooltipProvider delayDuration={200}>
        {/* Accessibility: Skip Link */}
        <SkipLink href="#main-content" />
        
        {/* Screen reader announcements */}
        <LiveRegion message="" mode="polite" />
        
        <Toaster />
        <Sonner position="top-right" theme="dark" richColors closeButton />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
          {/* AI ChatBot - Available on all pages */}
          <AIChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </PushChainProvider>
  </QueryClientProvider>
);

export default App;
