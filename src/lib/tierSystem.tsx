import React from 'react';
import { Shield, Gem, Crown, Award, Star } from 'lucide-react';

export interface Tier {
  id: string;
  name: string;
  minPoints: number;
  color: string;        // tailwind text color
  bgColor: string;      // tailwind bg color
  borderColor: string;  // tailwind border color
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
}

export const TIERS: Tier[] = [
  {
    id: 'unranked',
    name: 'Unranked',
    minPoints: 0,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    borderColor: 'border-muted/30',
    gradientFrom: 'from-muted/20',
    gradientTo: 'to-muted/5',
    icon: <Star className="w-full h-full" />,
  },
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/15',
    borderColor: 'border-amber-600/30',
    gradientFrom: 'from-amber-700/20',
    gradientTo: 'to-amber-700/5',
    icon: <Shield className="w-full h-full" />,
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 6,
    color: 'text-slate-300',
    bgColor: 'bg-slate-300/15',
    borderColor: 'border-slate-300/30',
    gradientFrom: 'from-slate-300/20',
    gradientTo: 'to-slate-400/5',
    icon: <Award className="w-full h-full" />,
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 12,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/15',
    borderColor: 'border-yellow-400/30',
    gradientFrom: 'from-yellow-400/20',
    gradientTo: 'to-yellow-500/5',
    icon: <Crown className="w-full h-full" />,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    minPoints: 20,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/15',
    borderColor: 'border-cyan-400/30',
    gradientFrom: 'from-cyan-400/20',
    gradientTo: 'to-cyan-500/5',
    icon: <Gem className="w-full h-full" />,
  },
];

export const getTier = (points: number): Tier => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
};

export const getNextTier = (points: number): Tier | null => {
  const current = getTier(points);
  const idx = TIERS.findIndex(t => t.id === current.id);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
};

export const getTierProgress = (points: number): number => {
  const current = getTier(points);
  const next = getNextTier(points);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(Math.round((progress / range) * 100), 100);
};
