import React, { useState, useCallback } from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Globe,
  Sliders,
  Bell,
  Shield,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  X,
  Loader2,
  Wifi,
  WifiOff,
  Palette,
  Volume2,
  VolumeX,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RPC_URL } from '@/config/contracts';

const Settings = () => {
  const {
    settings,
    updateSetting,
    resetSettings,
    validateRpcUrl,
    DEFAULT_SETTINGS,
  } = useSettings();

  const [isValidatingRpc, setIsValidatingRpc] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [tempRpcUrl, setTempRpcUrl] = useState(settings.customRpcUrl);

  // Validate custom RPC
  const handleValidateRpc = useCallback(async () => {
    if (!tempRpcUrl) {
      toast.error('Please enter an RPC URL');
      return;
    }

    setIsValidatingRpc(true);
    setRpcStatus('idle');

    try {
      const isValid = await validateRpcUrl(tempRpcUrl);
      
      if (isValid) {
        setRpcStatus('valid');
        updateSetting('customRpcUrl', tempRpcUrl);
        toast.success('RPC endpoint is valid!');
      } else {
        setRpcStatus('invalid');
        toast.error('Invalid RPC endpoint');
      }
    } catch {
      setRpcStatus('invalid');
      toast.error('Failed to validate RPC');
    } finally {
      setIsValidatingRpc(false);
    }
  }, [tempRpcUrl, validateRpcUrl, updateSetting]);

  // Reset handler
  const handleReset = useCallback(() => {
    resetSettings();
    setTempRpcUrl('');
    setRpcStatus('idle');
    toast.success('Settings reset to defaults');
  }, [resetSettings]);

  // Setting Card Component
  const SettingCard = ({ 
    icon: Icon, 
    title, 
    description, 
    children,
    badge,
  }: { 
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
    badge?: string;
  }) => (
    <div className="glass-card p-5 animate-fade-in hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <div className="shrink-0">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />

      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <HeroSection
            title="Settings"
            description="Customize your PUSHDEX experience"
            showSpotlight={false}
            showStars={true}
          />

          <Tabs defaultValue="network" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="network" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="trading" className="gap-2">
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">Trading</span>
              </TabsTrigger>
              <TabsTrigger value="display" className="gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Display</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
            </TabsList>

            {/* Network Settings */}
            <TabsContent value="network" className="space-y-4">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Network Configuration</h2>
                </div>

                {/* Default RPC */}
                <div className="p-4 rounded-xl bg-surface/50 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-muted-foreground">Default RPC</Label>
                    <Badge variant="outline" className="text-xs">
                      <Wifi className="w-3 h-3 mr-1" />
                      Push Testnet
                    </Badge>
                  </div>
                  <code className="text-sm text-muted-foreground font-mono">{RPC_URL}</code>
                </div>

                {/* Custom RPC Toggle */}
                <SettingCard
                  icon={Zap}
                  title="Use Custom RPC"
                  description="Connect to a custom RPC endpoint for faster transactions"
                >
                  <Switch
                    checked={settings.useCustomRpc}
                    onCheckedChange={(checked) => updateSetting('useCustomRpc', checked)}
                  />
                </SettingCard>

                {/* Custom RPC Input */}
                {settings.useCustomRpc && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3 animate-fade-in">
                    <Label>Custom RPC URL</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="https://your-rpc-endpoint.com"
                          value={tempRpcUrl}
                          onChange={(e) => {
                            setTempRpcUrl(e.target.value);
                            setRpcStatus('idle');
                          }}
                          className={cn(
                            "pr-10",
                            rpcStatus === 'valid' && "border-success",
                            rpcStatus === 'invalid' && "border-destructive"
                          )}
                        />
                        {rpcStatus !== 'idle' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {rpcStatus === 'valid' ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <X className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handleValidateRpc}
                        disabled={isValidatingRpc || !tempRpcUrl}
                        className="gap-2"
                      >
                        {isValidatingRpc ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wifi className="w-4 h-4" />
                        )}
                        Test
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter a valid Push Testnet RPC endpoint (Chain ID: 42101)
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Trading Settings */}
            <TabsContent value="trading" className="space-y-4">
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Trading Defaults</h2>
                </div>

                {/* Default Slippage */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Default Slippage Tolerance</Label>
                    <span className="text-sm font-medium text-primary">
                      {settings.defaultSlippage}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0, 3.0].map((value) => (
                      <Button
                        key={value}
                        variant={settings.defaultSlippage === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSetting('defaultSlippage', value)}
                        className={cn(
                          "transition-all duration-200",
                          settings.defaultSlippage === value && 'bg-gradient-pink'
                        )}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                  <Slider
                    value={[settings.defaultSlippage]}
                    onValueChange={([v]) => updateSetting('defaultSlippage', v)}
                    min={0.1}
                    max={10}
                    step={0.1}
                  />
                </div>

                <Separator />

                {/* Default Deadline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Default Transaction Deadline</Label>
                    <span className="text-sm font-medium text-primary">
                      {settings.defaultDeadline} minutes
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[10, 20, 30, 60].map((value) => (
                      <Button
                        key={value}
                        variant={settings.defaultDeadline === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSetting('defaultDeadline', value)}
                        className={cn(
                          "transition-all duration-200",
                          settings.defaultDeadline === value && 'bg-gradient-pink'
                        )}
                      >
                        {value}m
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Expert Mode */}
                <SettingCard
                  icon={AlertTriangle}
                  title="Expert Mode"
                  description="Skip confirmation modals and unlock advanced features"
                  badge="Advanced"
                >
                  <Switch
                    checked={settings.expertMode}
                    onCheckedChange={(checked) => updateSetting('expertMode', checked)}
                  />
                </SettingCard>
              </div>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display" className="space-y-4">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Display Preferences</h2>
                </div>

                {/* Theme */}
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: 'dark' | 'light' | 'system') => 
                      updateSetting('theme', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">🌙 Dark</SelectItem>
                      <SelectItem value="light">☀️ Light</SelectItem>
                      <SelectItem value="system">💻 System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Note: Only dark theme is currently fully styled
                  </p>
                </div>

                <Separator />

                {/* Language */}
                <div className="space-y-3">
                  <Label>Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value: 'en' | 'id') => updateSetting('language', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="id">🇮🇩 Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Note: Multi-language support coming soon
                  </p>
                </div>

                <Separator />

                <SettingCard
                  icon={Eye}
                  title="Compact Mode"
                  description="Reduce spacing and show more information on screen"
                >
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                  />
                </SettingCard>

                <SettingCard
                  icon={AlertTriangle}
                  title="Show Testnet Warning"
                  description="Display warning banner that you're on testnet"
                >
                  <Switch
                    checked={settings.showTestnetWarning}
                    onCheckedChange={(checked) => updateSetting('showTestnetWarning', checked)}
                  />
                </SettingCard>

                <SettingCard
                  icon={settings.enableSoundEffects ? Volume2 : VolumeX}
                  title="Sound Effects"
                  description="Play sounds for transactions and notifications"
                >
                  <Switch
                    checked={settings.enableSoundEffects}
                    onCheckedChange={(checked) => updateSetting('enableSoundEffects', checked)}
                  />
                </SettingCard>
              </div>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-4">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Privacy & Security</h2>
                </div>

                <SettingCard
                  icon={settings.hideBalances ? EyeOff : Eye}
                  title="Hide Balances"
                  description="Mask all balance amounts with asterisks"
                >
                  <Switch
                    checked={settings.hideBalances}
                    onCheckedChange={(checked) => updateSetting('hideBalances', checked)}
                  />
                </SettingCard>

                <SettingCard
                  icon={Bell}
                  title="Price Alerts"
                  description="Receive notifications when price targets are reached"
                >
                  <Switch
                    checked={settings.enablePriceAlerts}
                    onCheckedChange={(checked) => updateSetting('enablePriceAlerts', checked)}
                  />
                </SettingCard>

                <SettingCard
                  icon={Shield}
                  title="Disable Analytics"
                  description="Opt out of anonymous usage analytics"
                >
                  <Switch
                    checked={settings.disableAnalytics}
                    onCheckedChange={(checked) => updateSetting('disableAnalytics', checked)}
                  />
                </SettingCard>
              </div>

              {/* Danger Zone */}
              <div className="glass-card p-6 border-destructive/20">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <div>
                    <h3 className="font-medium">Reset All Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      This will reset all settings to their default values
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all your preferences to their default values. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset} className="bg-destructive">
                          Reset Settings
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
