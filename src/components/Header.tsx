import React, { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { WolfLogoText } from '@/components/WolfLogo';
import { WalletButton } from '@/components/WalletButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Droplets, LayoutGrid, BarChart3, Wallet, BookOpen, Leaf, Coins } from 'lucide-react';

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

export const Header: React.FC = memo(() => {
  const location = useLocation();

  return (
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

          {/* Navigation */}
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

          {/* Theme Toggle & Wallet */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/30" />
        <nav className="flex items-center justify-around py-1.5 px-2 relative">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-300',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
