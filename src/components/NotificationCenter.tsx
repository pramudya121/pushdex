import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Bell, 
  BellOff, 
  Settings,
  CheckCircle,
  Trash2,
  TrendingUp,
  RefreshCw,
  Gift,
  Fish,
  Info,
  X
} from 'lucide-react';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'price': return <TrendingUp className="w-4 h-4 text-blue-400" />;
    case 'trade': return <CheckCircle className="w-4 h-4 text-success" />;
    case 'reward': return <Gift className="w-4 h-4 text-purple-400" />;
    case 'whale': return <Fish className="w-4 h-4 text-cyan-400" />;
    default: return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

export const NotificationCenter = memo(() => {
  const {
    isSupported,
    permission,
    preferences,
    notifications,
    unreadCount,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearAll,
    updatePreferences,
    simulateNotification,
  } = usePushNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border/40" align="end">
        <Tabs defaultValue="notifications">
          <div className="flex items-center justify-between p-3 border-b border-border/40">
            <TabsList className="bg-surface h-8">
              <TabsTrigger value="notifications" className="text-xs h-6 px-2">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs h-6 px-2">
                Settings
              </TabsTrigger>
            </TabsList>
            
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs h-6"
              >
                Mark all read
              </Button>
            )}
          </div>
          
          <TabsContent value="notifications" className="m-0">
            {permission !== 'granted' && (
              <div className="p-3 bg-primary/5 border-b border-border/40">
                <p className="text-xs text-muted-foreground mb-2">
                  Enable push notifications to stay updated
                </p>
                <Button 
                  size="sm" 
                  onClick={requestPermission}
                  className="w-full text-xs"
                >
                  <Bell className="w-3 h-3 mr-2" />
                  Enable Notifications
                </Button>
              </div>
            )}
            
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <BellOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`p-3 rounded-lg hover:bg-surface/60 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-surface/40' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.body}
                            </p>
                            <span className="text-xs text-muted-foreground/60">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <div className="p-2 border-t border-border/40">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAll}
                  className="w-full text-xs text-muted-foreground"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="m-0">
            <ScrollArea className="h-[350px]">
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Notification Types</h4>
                  
                  {Object.entries(preferences).map(([key, value]) => {
                    const labels: Record<string, { label: string; desc: string }> = {
                      priceAlerts: { label: 'Price Alerts', desc: 'When tokens hit target prices' },
                      tradeExecuted: { label: 'Trade Executed', desc: 'When your swaps complete' },
                      lpRewards: { label: 'LP Rewards', desc: 'Liquidity pool earnings' },
                      whaleAlerts: { label: 'Whale Alerts', desc: 'Large transactions detected' },
                      farmingRewards: { label: 'Farming Rewards', desc: 'Farm harvest notifications' },
                      stakingRewards: { label: 'Staking Rewards', desc: 'Staking earnings updates' },
                      newPools: { label: 'New Pools', desc: 'When new pools are added' },
                      governanceVotes: { label: 'Governance', desc: 'Voting proposals' },
                    };
                    
                    const { label, desc } = labels[key] || { label: key, desc: '' };
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-xs text-muted-foreground">{desc}</div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => 
                            updatePreferences(key as keyof typeof preferences, checked)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Demo buttons for testing */}
                <div className="pt-4 border-t border-border/40">
                  <h4 className="text-sm font-medium mb-3">Test Notifications</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => simulateNotification('price')}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Price
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => simulateNotification('trade')}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Trade
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => simulateNotification('reward')}
                    >
                      <Gift className="w-3 h-3 mr-1" />
                      Reward
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => simulateNotification('whale')}
                    >
                      <Fish className="w-3 h-3 mr-1" />
                      Whale
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
});

NotificationCenter.displayName = 'NotificationCenter';
