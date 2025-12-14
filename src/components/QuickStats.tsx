import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Droplets } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS, RPC_URL } from '@/config/contracts';
import { FACTORY_ABI, PAIR_ABI } from '@/config/abis';

interface QuickStatsProps {
  className?: string;
}

export function QuickStats({ className }: QuickStatsProps) {
  const [stats, setStats] = useState({
    totalPools: 0,
    totalTVL: 0,
    volume24h: 0,
    priceChange: 2.5,
    transactions24h: 0,
    uniqueUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
        
        const pairCount = await factory.allPairsLength();
        const poolCount = Number(pairCount);

        let totalTVL = 0;
        const pairPromises = [];
        
        for (let i = 0; i < Math.min(poolCount, 10); i++) {
          pairPromises.push(factory.allPairs(i));
        }
        
        const pairAddresses = await Promise.all(pairPromises);
        
        for (const pairAddress of pairAddresses) {
          try {
            const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            const reserves = await pairContract.getReserves();
            const reserve0 = parseFloat(ethers.formatEther(reserves[0]));
            const reserve1 = parseFloat(ethers.formatEther(reserves[1]));
            totalTVL += (reserve0 + reserve1) * 0.5; // Simplified TVL calculation
          } catch (e) {
            console.error('Error fetching pair reserves:', e);
          }
        }

        setStats({
          totalPools: poolCount,
          totalTVL: totalTVL * 1000, // Mock price multiplier
          volume24h: totalTVL * 100, // Mock volume
          priceChange: (Math.random() - 0.5) * 10,
          transactions24h: Math.floor(Math.random() * 500) + 100,
          uniqueUsers: Math.floor(Math.random() * 200) + 50,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const statItems = [
    {
      icon: Droplets,
      label: 'Total Pools',
      value: stats.totalPools.toString(),
      color: 'text-blue-500',
    },
    {
      icon: DollarSign,
      label: 'Total TVL',
      value: formatNumber(stats.totalTVL),
      color: 'text-green-500',
    },
    {
      icon: Activity,
      label: '24h Volume',
      value: formatNumber(stats.volume24h),
      color: 'text-purple-500',
    },
    {
      icon: stats.priceChange >= 0 ? TrendingUp : TrendingDown,
      label: 'PC Price',
      value: `${stats.priceChange >= 0 ? '+' : ''}${stats.priceChange.toFixed(2)}%`,
      color: stats.priceChange >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card/50 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2" />
            <div className="h-6 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 hover:bg-card/70 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-lg font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
