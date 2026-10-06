import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalWeatherState {
  status: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  summary: string;
}

interface MarketStateContextType {
  timeplay: number;
  setTimeplay: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  weatherPlaying: boolean;
  setWeatherPlaying: (val: boolean) => void;
  globalWeatherState: GlobalWeatherState;
  setGlobalWeatherState: (val: GlobalWeatherState) => void;
}

const defaultWeatherState: GlobalWeatherState = {
  status: 'volatile',
  summary: 'A massive inflationary front is moving across the Atlantic, expect turbulence in European tech equities.'
};

const MarketStateContext = createContext<MarketStateContextType>({
  timeplay: 100,
  setTimeplay: () => {},
  isPlaying: true,
  setIsPlaying: () => {},
  weatherPlaying: false,
  setWeatherPlaying: () => {},
  globalWeatherState: defaultWeatherState,
  setGlobalWeatherState: () => {},
});

export const MarketStateProvider = ({ children }: { children: ReactNode }) => {
  const [timeplay, setTimeplay] = useState(100);
  const [isPlaying, setIsPlaying] = useState(true);
  const [weatherPlaying, setWeatherPlaying] = useState(false);
  const [globalWeatherState, setGlobalWeatherState] = useState<GlobalWeatherState>(defaultWeatherState);

  return (
    <MarketStateContext.Provider value={{
      timeplay,
      setTimeplay,
      isPlaying,
      setIsPlaying,
      weatherPlaying,
      setWeatherPlaying,
      globalWeatherState,
      setGlobalWeatherState
    }}>
      {children}
    </MarketStateContext.Provider>
  );
};

export const useMarketState = () => useContext(MarketStateContext);
