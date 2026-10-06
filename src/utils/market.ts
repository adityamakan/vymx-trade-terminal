// Timezone and operating hours definitions for global assets
export interface MarketStatus {
  isOpen: boolean;
  statusText: string;
  className: string;
  timezoneCode: string;
  currentTimeStr: string;
  hoursDescription: string;
  currentDay: string;
}

// Robust components in a specific timezone
export function getParsedTimezone(timezone: string) {
  try {
    const options = {
      timeZone: timezone,
      weekday: 'long' as const,
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      hourCycle: 'h23' as const
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    
    let day = 'Monday';
    let hour = 12;
    let minute = 0;
    
    for (const part of parts) {
      if (part.type === 'weekday') day = part.value;
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }
    
    if (isNaN(hour)) hour = 0;
    if (isNaN(minute)) minute = 0;
    
    return { day, hour, minute, totalMins: hour * 60 + minute };
  } catch (e) {
    const d = new Date();
    // Default fallback to local system time if formatter fails
    return { 
      day: d.toLocaleDateString('en-US', { weekday: 'long' }), 
      hour: d.getHours(), 
      minute: d.getMinutes(), 
      totalMins: d.getHours() * 60 + d.getMinutes() 
    };
  }
}

/**
 * Checks the true real-time operational status of any global financial asset.
 */
export function getAssetMarketStatus(
  symbol: string,
  type: string,
  country: string,
  isStrictHours: boolean
): MarketStatus {
  // We parse the current day and hours using Asia/Kolkata (IST) for display text
  const infoIST = getParsedTimezone('Asia/Kolkata');
  const timeStr = `${infoIST.hour.toString().padStart(2, '0')}:${infoIST.minute.toString().padStart(2, '0')}`;

  // 1. CRYPTO - Always Live 24/7/365 in Indian Standard Time (IST)
  if (type === 'crypto') {
    return {
      isOpen: true,
      statusText: 'LIVE 24/7',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      timezoneCode: 'IST',
      currentTimeStr: timeStr,
      currentDay: infoIST.day,
      hoursDescription: 'Continuous operations 24/7/365 in IST'
    };
  }

  // 2. FOREX & COMMODITIES - Weekdays (Mon-Fri 24h) under IST
  if (type === 'forex' || type === 'commodity') {
    const isWeekend = infoIST.day === 'Saturday' || infoIST.day === 'Sunday';
    const isOpen = !isWeekend;

    if (!isOpen && isStrictHours) {
      return {
        isOpen: false,
        statusText: 'WEEKEND CLOSED',
        className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        timezoneCode: 'IST',
        currentTimeStr: timeStr,
        currentDay: infoIST.day,
        hoursDescription: 'Trades continuous from Mon 00:00 to Fri 24:00 (IST)'
      };
    }

    return {
      isOpen: true,
      statusText: isStrictHours ? 'LIVE SESSION' : 'SANDBOX LIVE',
      className: isStrictHours ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      timezoneCode: 'IST',
      currentTimeStr: timeStr,
      currentDay: infoIST.day,
      hoursDescription: 'Trades weekdays 24 hours in IST'
    };
  }

  // 3. BONDS & EQUITIES (Stocks, Indices, Bonds)
  let isMarketOpen = false;
  let hoursDescription = '';

  if (country === 'United States') {
    const infoUS = getParsedTimezone('America/New_York');
    const isUSWeekend = infoUS.day === 'Saturday' || infoUS.day === 'Sunday';
    // US Markets: 09:30 AM to 04:00 PM EST (570 to 960 mins)
    isMarketOpen = !isUSWeekend && infoUS.totalMins >= 570 && infoUS.totalMins <= 960;
    hoursDescription = 'Trades Mon-Fri 07:00 PM to 01:30 AM IST (09:30 - 16:00 EST)';
  } else {
    // defaults to Indian markets
    const isIndWeekend = infoIST.day === 'Saturday' || infoIST.day === 'Sunday';
    // Indian Stocks: 09:15 AM to 03:30 PM IST (555 to 930 mins)
    isMarketOpen = !isIndWeekend && infoIST.totalMins >= 555 && infoIST.totalMins <= 930;
    hoursDescription = 'Trades Mon-Fri 09:15 AM to 03:30 PM IST';
  }

  if (!isMarketOpen && isStrictHours) {
    return {
      isOpen: false,
      statusText: 'CLOSED',
      className: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      timezoneCode: 'IST',
      currentTimeStr: timeStr,
      currentDay: infoIST.day,
      hoursDescription
    };
  }

  return {
    isOpen: true,
    statusText: isStrictHours ? 'LIVE SESSION' : 'SANDBOX LIVE',
    className: isStrictHours ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    timezoneCode: 'IST',
    currentTimeStr: timeStr,
    currentDay: infoIST.day,
    hoursDescription
  };
}

export function calculateSMA(data: number[], period: number): number[] {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calculateEMA(data: number[], period: number): number[] {
  const ema = [];
  const multiplier = 2 / (period + 1);
  let prevEma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      ema.push(prevEma);
    } else {
      const currentEma = (data[i] - prevEma) * multiplier + prevEma;
      ema.push(currentEma);
      prevEma = currentEma;
    }
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(NaN);
    } else if (i === period) {
      let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + rs)));
    } else {
      const diff = data[i] - data[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + rs)));
    }
  }
  return rsi;
}

export function calculateBollingerBands(data: number[], period: number = 20, multiplier: number = 2) {
  const sma = calculateSMA(data, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      upper.push(mean + multiplier * stdDev);
      lower.push(mean - multiplier * stdDev);
    }
  }
  return { sma, upper, lower };
}

export function detectMACrossover(prices: number[], shortPeriod: number = 5, longPeriod: number = 20): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  if (prices.length < longPeriod) return 'NEUTRAL';
  
  const shortSMA = calculateSMA(prices, shortPeriod);
  const longSMA = calculateSMA(prices, longPeriod);
  
  const currentShort = shortSMA[shortSMA.length - 1];
  const currentLong = longSMA[longSMA.length - 1];
  
  if (isNaN(currentShort) || isNaN(currentLong)) return 'NEUTRAL';
  
  if (currentShort > currentLong) return 'BULLISH';
  if (currentShort < currentLong) return 'BEARISH';
  return 'NEUTRAL';
}
