// Tracks completed on-chain actions for airdrop verification
const STORAGE_KEY = 'airdrop_verified_actions';

export type AirdropAction = 'swap' | 'add_liquidity' | 'remove_liquidity' | 'farming' | 'staking';

interface VerifiedAction {
  action: AirdropAction;
  txHash: string;
  timestamp: number;
  wallet: string;
}

export const getVerifiedActions = (wallet: string): VerifiedAction[] => {
  try {
    const all: VerifiedAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return all.filter(a => a.wallet.toLowerCase() === wallet.toLowerCase());
  } catch {
    return [];
  }
};

export const isActionVerified = (wallet: string, action: AirdropAction): boolean => {
  return getVerifiedActions(wallet).some(a => a.action === action && !!a.txHash);
};

/** Get the tx hash for a verified action */
export const getVerifiedTxHash = (wallet: string, action: AirdropAction): string | null => {
  const actions = getVerifiedActions(wallet);
  const found = actions.find(a => a.action === action && !!a.txHash);
  return found?.txHash || null;
};

/**
 * Mark an on-chain action as verified. txHash is REQUIRED.
 * Without a valid tx hash the action will NOT be stored.
 */
export const markActionVerified = (wallet: string, action: AirdropAction, txHash: string) => {
  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    console.warn('markActionVerified: invalid or missing txHash, skipping');
    return;
  }
  try {
    const all: VerifiedAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // Don't duplicate
    if (all.some(a => a.wallet.toLowerCase() === wallet.toLowerCase() && a.action === action)) return;
    all.push({ action, txHash, timestamp: Date.now(), wallet: wallet.toLowerCase() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    // Dispatch event so airdrop page can react
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
