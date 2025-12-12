import { ethers } from 'ethers';
import { CONTRACTS } from '@/config/contracts';
import { WETH_ABI } from '@/config/abis';
import { getReadProvider } from './dex';

// Get WETH contract instance
export const getWETHContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(CONTRACTS.WETH, WETH_ABI, signerOrProvider);
};

// Wrap native PC to WPC (WETH)
export const wrapPC = async (
  signer: ethers.Signer,
  amount: bigint
): Promise<ethers.TransactionResponse> => {
  const weth = getWETHContract(signer);
  const tx = await weth.deposit({ value: amount });
  return tx;
};

// Unwrap WPC to native PC
export const unwrapPC = async (
  signer: ethers.Signer,
  amount: bigint
): Promise<ethers.TransactionResponse> => {
  const weth = getWETHContract(signer);
  const tx = await weth.withdraw(amount);
  return tx;
};

// Get WPC balance
export const getWPCBalance = async (address: string): Promise<bigint> => {
  const provider = getReadProvider();
  const weth = getWETHContract(provider);
  return await weth.balanceOf(address);
};

// Get total supply of WPC
export const getWPCTotalSupply = async (): Promise<bigint> => {
  const provider = getReadProvider();
  const weth = getWETHContract(provider);
  return await weth.totalSupply();
};

// Approve WPC spending
export const approveWPC = async (
  signer: ethers.Signer,
  spender: string,
  amount: bigint = ethers.MaxUint256
): Promise<ethers.TransactionResponse> => {
  const weth = getWETHContract(signer);
  const tx = await weth.approve(spender, amount);
  return tx;
};

// Get WPC allowance
export const getWPCAllowance = async (
  owner: string,
  spender: string
): Promise<bigint> => {
  const provider = getReadProvider();
  const weth = getWETHContract(provider);
  return await weth.allowance(owner, spender);
};

// Transfer WPC
export const transferWPC = async (
  signer: ethers.Signer,
  to: string,
  amount: bigint
): Promise<ethers.TransactionResponse> => {
  const weth = getWETHContract(signer);
  const tx = await weth.transfer(to, amount);
  return tx;
};
