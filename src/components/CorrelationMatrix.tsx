import React, { useMemo } from 'react';
import { Asset } from '../types';

interface CorrelationMatrixProps {
  assets: Asset[];
}

export default function CorrelationMatrix({ assets }: CorrelationMatrixProps) {
  const symbols = useMemo(() => [...assets]
    .sort((a, b) => a.symbol.localeCompare(b.symbol)
    .slice(0, 15)
    .map((asset) => asset.symbol), [assets]);

  return (
    <div className="w-full min-h-[320px] bg-zinc-950 rounded-3xl border border-zinc-800 p-6">
      <h3 className="text-sm font-bold text-zinc-100 mb-2">Historical return correlation matrix</h3>
      <p className="text-xs text-zinc-400 mb-5">No correlation values are inferred from sector, country or asset type. A valid matrix requires aligned provider-backed historical returns for each selected instrument.</p>
      {symbols.length < 2 ? (
        <p className="text-sm text-zinc-500">At least two instruments are required.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 text-xs text-zinc-500">
          <p>Historical return series have not been loaded for this cross-asset matrix.</p>
          <p>Symbols in scope: {symbols.join(', ')}</p>
          <p>Values are withheld rather than displaying synthetic correlations.</p>
        </div>
      )}
    </div>
  );
}
