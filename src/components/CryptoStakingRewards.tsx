import React from 'react';
import { PortfolioItem, Asset } from '../types';
import { ShieldAlert } from 'lucide-react';

interface CryptoStakingRewardsProps {
  portfolio: PortfolioItem[];
  assets: Asset[];
}

export default function CryptoStakingRewards({ portfolio, assets }: CryptoStakingRewardsProps) {
  const eligibleCount = portfolio.filter((item) =>
    item.quantity > 0 && assets.some((asset) => asset.symbol === item.symbol && asset.type === 'crypto')
  ).length;

  return (
    <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <ShieldAlert className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Crypto staking data</h3>
      </div>
      <p className="text-sm text-zinc-400">Staking is not connected to a blockchain validator, wallet, exchange or rewards provider. APY and reward accrual are therefore unavailable. No assets are locked and no staking transaction is performed by this simulator.</p>
      <p className="text-xs text-zinc-500 mt-3">Eligible crypto positions detected in this paper portfolio: {eligibleCount}. This count does not imply staking eligibility on any network.</p>
    </section>
  );
}
