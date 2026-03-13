// Tracks completed on-chain actions for airdrop verification
const STORAGE_KEY = 'airdrop_verified_actions';
const DAILY_RESET_MS = 24 * 60 * 60 * 1000; // 24 hours

export type AirdropAction = 'swap' | 'add_liquidity' | 'remove_liquidity' | 'farming' | 'staking';

interface VerifiedAction {
  action: AirdropAction;
  txHash: string;
  timestamp: number;
  wallet: string;
}

/** Get verified actions for a wallet, filtering out expired ones (>24h) */
export const getVerifiedActions = (wallet: string): VerifiedAction[] => {
  try {
    const all: VerifiedAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const now = Date.now();
    // Only return actions from the last 24 hours
    return all.filter(a => 
      a.wallet.toLowerCase() === wallet.toLowerCase() && 
      (now - a.timestamp) < DAILY_RESET_MS
    );
  } catch {
    return [];
  }
};

/** Clean up expired actions from localStorage */
const cleanupExpiredActions = () => {
  try {
    const all: VerifiedAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const now = Date.now();
    const valid = all.filter(a => (now - a.timestamp) < DAILY_RESET_MS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
  } catch {
    // silent
  }
};

export const isActionVerified = (wallet: string, action: AirdropAction): boolean => {
  return getVerifiedActions(wallet).some(a => a.action === action && !!a.txHash);
};

/** Get the tx hash for a verified action (only if within 24h window) */
export const getVerifiedTxHash = (wallet: string, action: AirdropAction): string | null => {
  const actions = getVerifiedActions(wallet);
  const found = actions.find(a => a.action === action && !!a.txHash);
  return found?.txHash || null;
};

/** Get time remaining until an action resets (in ms). Returns 0 if already reset. */
export const getActionResetTime = (wallet: string, action: AirdropAction): number => {
  try {
    const all: VerifiedAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const found = all.find(a => 
      a.wallet.toLowerCase() === wallet.toLowerCase() && a.action === action
    );
    if (!found) return 0;
    const elapsed = Date.now() - found.timestamp;
    return Math.max(0, DAILY_RESET_MS - elapsed);
  } catch {
    return 0;
  }
};

/**
 * Mark an on-chain action as verified. txHash is REQUIRED.
 * Replaces any existing entry for this wallet+action (daily reset).
 */
export const markActionVerified = (wallet: string, action: AirdropAction, txHash: string) => {
  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    console.warn('markActionVerified: invalid or missing txHash, skipping');
    return;
  }
  try {
    cleanupExpiredActions();
    const all: VerifiedAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // Remove old entry for this wallet+action (allow re-verification after new tx)
    const filtered = all.filter(a => 
      !(a.wallet.toLowerCase() === wallet.toLowerCase() && a.action === action)
    );
    filtered.push({ action, txHash, timestamp: Date.now(), wallet: wallet.toLowerCase() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('airdrop-action-verified', { detail: { action, wallet, txHash } }));
  } catch {
    // silent
  }
};

// Twitter/X connection tracking
const TWITTER_KEY = 'airdrop_twitter_connected';

export const isTwitterConnected = (wallet: string): boolean => {
  try {
    const data = JSON.parse(localStorage.getItem(TWITTER_KEY) || '{}');
    return !!data[wallet.toLowerCase()];
  } catch {
    return false;
  }
};

export const setTwitterConnected = (wallet: string, handle?: string) => {
  try {
    const data = JSON.parse(localStorage.getItem(TWITTER_KEY) || '{}');
    data[wallet.toLowerCase()] = { connected: true, handle, timestamp: Date.now() };
    localStorage.setItem(TWITTER_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('airdrop-twitter-connected', { detail: { wallet } }));
  } catch {
    // silent
  }
};
