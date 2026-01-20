import React, { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { WolfLogoText } from '@/components/WolfLogo';
import { WalletButton } from '@/components/WalletButton';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Droplets, LayoutGrid, BarChart3, Wallet, BookOpen, Leaf, Coins } from 'lucide-react';
import { FloatingDock } from '@/components/ui/aceternity/floating-dock';

const NAV_ITEMS = [
  { path: '/', label: 'Swap', icon: ArrowLeftRight },
  { path: '/liquidity', label: 'Liquidity', icon: Droplets },
  { path: '/pools', label: 'Pools', icon: LayoutGrid },
  { path: '/farming', label: 'Farming', icon: Leaf },
  { path: '/staking', label: 'Staking', icon: Coins },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/docs', label: 'Docs', icon: BookOpen },
];

// Transform NAV_ITEMS for FloatingDock format
const DOCK_ITEMS = NAV_ITEMS.map((item) => ({
  title: item.label,
  icon: <item.icon className="w-full h-full" />,
  href: item.path,
}));

export const Header: React.FC = memo(() => {
  const location = useLocation();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl border-b border-border/30" />
        
        {/* Gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center group">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <WolfLogoText />
              </div>
            </NavLink>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-2xl bg-surface/50 border border-border/30">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative',
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Wallet */}
            <div className="flex items-center gap-3">
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Floating Dock */}
      <div className="lg:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center">
        <FloatingDock 
          items={DOCK_ITEMS}
          desktopClassName="hidden"
          mobileClassName="flex"
        />
      </div>
    </>
  );
});

Header.displayName = 'Header';
