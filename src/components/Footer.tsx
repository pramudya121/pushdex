import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Twitter, 
  Github, 
  MessageCircle, 
  ExternalLink,
  Heart,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WolfLogo } from '@/components/WolfLogo';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children, external }) => {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1 group"
      >
        {children}
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }
  
  return (
    <Link
      to={href}
      className="text-muted-foreground hover:text-foreground transition-colors duration-200"
    >
      {children}
    </Link>
  );
};

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="p-2.5 rounded-xl bg-surface/50 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-110 active:scale-95"
  >
    {icon}
  </a>
);

export const Footer: React.FC = memo(() => {
  const currentYear = new Date().getFullYear();
  
  const productLinks = [
    { href: '/swap', label: 'Swap' },
    { href: '/liquidity', label: 'Liquidity' },
    { href: '/pools', label: 'Pools' },
    { href: '/farming', label: 'Farming' },
    { href: '/staking', label: 'Staking' },
  ];
  
  const resourceLinks = [
    { href: '/docs', label: 'Documentation' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/pushchain-docs', label: 'Push Chain Docs', external: true },
    { href: 'https://donut.push.network', label: 'Block Explorer', external: true },
  ];
  
  const socialLinks = [
    { href: 'https://x.com/pushdex', icon: <Twitter className="w-5 h-5" />, label: 'Twitter' },
    { href: 'https://github.com/push-protocol', icon: <Github className="w-5 h-5" />, label: 'GitHub' },
    { href: 'https://discord.gg/pushprotocol', icon: <MessageCircle className="w-5 h-5" />, label: 'Discord' },
  ];

  return (
    <footer className="relative z-10 border-t border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <WolfLogo className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold gradient-text">PUSHDEX</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              The next-generation decentralized exchange built on Push Chain. Trade, earn, and grow your portfolio.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>Powered by Push Protocol</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Products</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} external={link.external}>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Community</h4>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((link) => (
                <SocialLink key={link.label} {...link} />
              ))}
            </div>
            <div className="p-4 rounded-xl bg-surface/50 border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">
                Join our growing community
              </p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background"
                      style={{ opacity: 1 - i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground">2,000+ members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} PUSHDEX. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-primary mx-1 animate-pulse" />
              <span>on Push Chain</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <FooterLink href="/docs">Terms</FooterLink>
              <FooterLink href="/docs">Privacy</FooterLink>
              <FooterLink href="/docs">Cookies</FooterLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
