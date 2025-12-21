import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import Liquidity from "./pages/Liquidity";
import Pools from "./pages/Pools";
import PoolDetail from "./pages/PoolDetail";
import Analytics from "./pages/Analytics";
import Portfolio from "./pages/Portfolio";
import CreatePool from "./pages/CreatePool";
import History from "./pages/History";
import Farming from "./pages/Farming";
import Staking from "./pages/Staking";
import Docs from "./pages/Docs";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" theme="dark" />
        <BrowserRouter>
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
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
