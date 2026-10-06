import React, { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  children: ReactNode;
  width?: string | number;
  height?: string | number;
  minWidth?: number;
  minHeight?: number;
}

export function ChartContainer({ children, width = '100%', height = '100%', minWidth, minHeight }: ChartContainerProps) {
  return (
    <div style={{ width, height, minWidth, minHeight, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  );
}
