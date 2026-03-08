// Admin wallet addresses (lowercase) that can access the admin panel
export const ADMIN_WALLETS: string[] = [
  // Add your admin wallet addresses here (lowercase)
  // e.g. '0x1234...abcd'
];

export const isAdminWallet = (address: string | null): boolean => {
  if (!address) return false;
  // If no admin wallets configured, allow any connected wallet (dev mode)
  if (ADMIN_WALLETS.length === 0) return true;
  return ADMIN_WALLETS.some(w => w.toLowerCase() === address.toLowerCase());
};
