import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Check for stored preference or system preference
    const stored = localStorage.getItem('pushdex_theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'light') {
      root.classList.add('light');
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--foreground', '240 10% 4%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '240 10% 4%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '240 10% 4%');
      root.style.setProperty('--secondary', '240 5% 92%');
      root.style.setProperty('--secondary-foreground', '240 10% 4%');
      root.style.setProperty('--muted', '240 5% 92%');
      root.style.setProperty('--muted-foreground', '240 5% 46%');
      root.style.setProperty('--border', '240 5% 84%');
      root.style.setProperty('--input', '240 5% 84%');
      root.style.setProperty('--surface', '0 0% 96%');
      root.style.setProperty('--surface-hover', '0 0% 92%');
    } else {
      root.classList.remove('light');
      root.style.setProperty('--background', '240 10% 4%');
      root.style.setProperty('--foreground', '0 0% 98%');
      root.style.setProperty('--card', '240 10% 6%');
      root.style.setProperty('--card-foreground', '0 0% 98%');
      root.style.setProperty('--popover', '240 10% 6%');
      root.style.setProperty('--popover-foreground', '0 0% 98%');
      root.style.setProperty('--secondary', '240 10% 12%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--muted', '240 10% 15%');
      root.style.setProperty('--muted-foreground', '240 5% 65%');
      root.style.setProperty('--border', '240 10% 18%');
      root.style.setProperty('--input', '240 10% 18%');
      root.style.setProperty('--surface', '240 10% 8%');
      root.style.setProperty('--surface-hover', '240 10% 12%');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('pushdex_theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className={`h-4 w-4 transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
      <Moon className={`absolute h-4 w-4 transition-all ${theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
