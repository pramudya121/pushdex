import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WaveBackground } from "@/components/WaveBackground";
import { WolfLogo } from "@/components/WolfLogo";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "404 - Page Not Found | PUSHDEX";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <WaveBackground />
      <Header />
      <main className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mb-6">
            <WolfLogo size={64} />
          </div>
          <h1 className="text-7xl font-bold gradient-text mb-4">404</h1>
          <p className="text-xl text-foreground font-semibold mb-2">Page Not Found</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{location.pathname}</code> doesn't exist.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
            <Link to="/">
              <Button className="gap-2">
                <Home className="w-4 h-4" /> Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
