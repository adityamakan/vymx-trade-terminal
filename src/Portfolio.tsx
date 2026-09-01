import React, { useRef, useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { Wallet, TrendingUp, TrendingDown, Clock, HelpCircle, History, PackageOpen, Download, Activity, Cpu, Box, Sparkles, Server, Globe, FileText, Bot, X } from 'lucide-react';
import { PortfolioItem, Transaction, Asset } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import RiskDashboard from './RiskDashboard';
import CryptoStakingRewards from './CryptoStakingRewards';

interface PortfolioProps {
  virtualBalance: number;
  portfolio: PortfolioItem[];
  transactions: Transaction[];
  onSelectAsset: (asset: Asset) => void;
  setView: (view: any) => void;
  assets: Asset[];
  formatCurrency: (val: number, type?: string, country?: string) => string;
  onUpdateTransactionNote: (id: string, note: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#14b8a6'];

export default function Portfolio({
  virtualBalance,
  portfolio,
  transactions,
  onSelectAsset,
  setView,
  assets,
  formatCurrency: formatCurrencyProp,
  onUpdateTransactionNote,
}: PortfolioProps) {

  const formatCurrency = (val: number, type: string = 'cash', assetCountry?: string) => {
    const matchedAsset = assets.find(a => a.symbol === type || a.price === val);
    const country = assetCountry || matchedAsset?.country;
    return formatCurrencyProp(val, type, country);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    // Headers for transactions records
    const headers = ['Transaction ID', 'Timestamp Date', 'Asset Symbol', 'Trade Action', 'Quantity', 'Execution Price', 'Total Settlement Value (USD)'];
    
    // Rows mapped cleanly
    const rows = transactions.map((tx) => [
      tx.id,
      tx.date,
      tx.symbol,
      tx.type,
      tx.quantity,
      tx.price,
      tx.total
    ]);
    
    // CSV Generation with double-bracket quotation safeguards for excel formats
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const cell = val === null || val === undefined ? '' : String(val);
        return cell.includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell;
      }).join(','))
    ].join('\n');

    // Create client transfer element trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `finova_virtual_settlements_${new Date().toISOString().split('T')[0]}.csv`);
    downloadAnchor.style.visibility = 'hidden';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add header
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text('Vymx Portfolio Summary', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      let currentY = 40;

      // Try capturing Growth Chart
      const growthChartEl = document.getElementById('growth-chart-container');
      if (growthChartEl) {
        const canvas = await html2canvas(growthChartEl, { backgroundColor: '#09090b', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = pageWidth - 28;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.setFontSize(14);
        doc.setTextColor(20, 20, 20);
        doc.text('Performance History', 14, currentY);
        currentY += 8;
        doc.addImage(imgData, 'PNG', 14, currentY, pdfWidth, pdfHeight);
        currentY += pdfHeight + 15;
      }

      // Try capturing Allocation Chart
      const allocChartEl = document.getElementById('allocation-chart-container');
      if (allocChartEl) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }
        const canvas = await html2canvas(allocChartEl, { backgroundColor: '#09090b', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = (pageWidth - 28) * 0.6;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.setFontSize(14);
        doc.setTextColor(20, 20, 20);
        doc.text('Asset Distribution', 14, currentY);
        currentY += 8;
        doc.addImage(imgData, 'PNG', 14, currentY, pdfWidth, pdfHeight);
        currentY += pdfHeight + 15;
      }

      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      // Portfolio Information
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text('Asset Holdings', 14, currentY);
      
      const holdingRows = portfolio.map(item => {
        const liveAsset = assets.find(a => a.symbol === item.symbol);
        const currentPrice = liveAsset ? liveAsset.price : item.avgBuyPrice;
        const totalValue = item.quantity * currentPrice;
        return [
          item.symbol, 
          item.name, 
          item.quantity.toString(), 
          formatCurrency(item.avgBuyPrice, item.symbol),
          formatCurrency(currentPrice, item.symbol),
          formatCurrency(totalValue)
        ];
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Symbol', 'Name', 'Quantity', 'Avg Cost', 'Current Price', 'Total Value']],
        body: holdingRows,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] }
      });
      
      // Transactions Record
      const finalY = (doc as any).lastAutoTable.finalY || (currentY + 10);
      doc.text('Recent Transactions', 14, finalY + 15);
      
      const txRows = transactions.slice(0, 50).map(tx => [ // Limit up to 50
        tx.date.split(',')[0],
        tx.type,
        tx.symbol,
        tx.quantity.toString(),
        formatCurrency(tx.price, tx.symbol),
        formatCurrency(tx.total)
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Date', 'Action', 'Symbol', 'Quantity', 'Price', 'Total']],
        body: txRows,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] }
      });

      // Save
      doc.save(`vymx_portfolio_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 3D Visualizer Canvas Ref
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);

  const [showAiReview, setShowAiReview] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);

  const handleAiReview = () => {
    setShowAiReview(true);
    setIsAiLoading(true);
    // Simulate AI API Call
    setTimeout(() => {
      let totalHoldingsValue = 0;
      const sectors: Record<string, number> = {};
      portfolio.forEach((item) => {
        const liveAsset = assets.find((a) => a.symbol === item.symbol);
        const currentPrice = liveAsset ? liveAsset.price : item.avgBuyPrice;
        const val = item.quantity * currentPrice;
        const sector = liveAsset?.sector || 'Unknown';
        sectors[sector] = (sectors[sector] || 0) + val;
        totalHoldingsValue += val;
      });

      const sectorAllocation = Object.keys(sectors).map(name => ({
        name,
        value: sectors[name]
      }));

      // Very basic AI mock based on allocations
      const topAllocation = sectorAllocation.sort((a,b) => b.value - a.value)[0];
      
      let review = `### Portfolio Executive Summary\n\n`;
      review += `Based on current holdings, your portfolio displays a concentration in the **${topAllocation?.name || 'unknown'}** sector, making up approximately ${Math.round((topAllocation?.value || 0) / (totalHoldingsValue || 1) * 100)}% of your active equity.\n\n`;
      review += `**Diversification Check:**\n`;
      if (sectorAllocation.length < 3) {
        review += `- You only hold assets across ${sectorAllocation.length} sectors. Consider diversifying across Healthcare or Industrials to reduce idiosyncratic risk.\n`;
      } else {
        review += `- Healthy sector spread across ${sectorAllocation.length} distinct industries.\n`;
      }
      
      const isTechHeavy = !!sectorAllocation.find(s => s.name === 'Technology' && s.value / totalHoldingsValue > 0.4);
      if (isTechHeavy) {
        review += `- High technology exposure implies higher beta. Great in bull markets but vulnerable to rate hikes.\n`;
      }

      review += `\n**Risk Profile:** Growth / Aggressive\n`;
      review += `\n*Recommendation*: Monitor macro variables such as inflation data closely, as they will disproportionately impact your top holdings.`;
      
      setAiReviewResult(review);
      setIsAiLoading(false);
    }, 2500);
  };

  // Generate high-fidelity deterministic/semi-dynamic 30-day historical ledger sequence
  const performanceHistory = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Calculate final net equity first to ensure we can match today's actual value perfectly
    let calcTotalHoldings = 0;
    portfolio.forEach((item) => {
      const liveAsset = assets.find((a) => a.symbol === item.symbol);
      const currentPrice = liveAsset ? liveAsset.price : item.avgBuyPrice;
      calcTotalHoldings += item.quantity * currentPrice;
    });
    const finalNetEquity = virtualBalance + calcTotalHoldings;

    // Seed based on portfolio contents or fallback
    const seed = portfolio.length > 0 
      ? portfolio.reduce((acc, h) => acc + h.symbol.charCodeAt(0) * h.quantity, 0)
      : 124;

    // Let's model a realistic cumulative 30 days lookback sequence backward
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Compute smooth multi-octave performance walk
      const ratio = (30 - i) / 30; // 0.033 to 1.0
      
      // Sine wave walk
      const sineWave = Math.sin((30 - i) * 0.45 + (seed % 10)) * (calcTotalHoldings * 0.05 + 800);
      // Cosine secondary octave
      const cosWave = Math.cos((30 - i) * 0.8 + (seed % 7)) * (calcTotalHoldings * 0.02 + 300);
      // Upward organic trend
      const trendLine = (30 - i) * (calcTotalHoldings * 0.003 + 50);

      // Interpolate starting balance around 95% to 102% of final equity
      const baseInterpolated = finalNetEquity * (0.94 + 0.04 * (seed % 100 / 100));
      
      let stepBalance = baseInterpolated + trendLine + sineWave + cosWave;
      
      // Ensure the very last element (today) is strictly equal to the actual live Net Equity
      if (i === 0) {
        stepBalance = finalNetEquity;
      }

      data.push({
        dayIndex: 30 - i,
        date: dateStr,
        balance: Math.round(Math.max(1000, stepBalance)),
        holdingsVal: Math.round(Math.max(0, calcTotalHoldings * ratio + sineWave * 0.3)),
        cashVal: Math.round(virtualBalance),
      });
    }
    
    return data;
  }, [portfolio, virtualBalance, assets]);

  // Compute key institutional portfolio parameters
  const quantStats = useMemo(() => {
    if (performanceHistory.length === 0) {
      return { 
        sharpe: 2.1, 
        maxDrawdown: 1.2, 
        volatility: 4.8, 
        totalReturnPct: 5.4,
        portfolioBeta: 1.15,
        diversificationScore: 85,
        varValue: 420,
        alpha: 2.45
      };
    }
    
    const balances = performanceHistory.map(d => d.balance);
    const start = balances[0];
    const end = balances[balances.length - 1];
    
    // Sharpe Ratio representation
    const sharpe = parseFloat((1.85 + (end > start ? 0.95 : -0.45) + (portfolio.length * 0.15)).toFixed(2));
    
    // Peak finding for max drawdown
    let peak = start;
    let maxDd = 0;
    balances.forEach(b => {
      if (b > peak) peak = b;
      const dd = ((peak - b) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    });

    const volatility = parseFloat((3.4 + (portfolio.length * 0.6) + (maxDd * 0.2)).toFixed(1));
    const totalReturnPct = ((end - start) / start) * 100;

    // Advanced Stats integrations
    const totalEquity = virtualBalance + portfolio.reduce((acc, p) => {
      const pPrice = assets.find(a => a.symbol === p.symbol)?.price || p.avgBuyPrice;
      return acc + p.quantity * pPrice;
    }, 0);

    // 1. Portfolio Beta
    let weightedBetaSum = 0;
    portfolio.forEach((p) => {
      const pPrice = assets.find(a => a.symbol === p.symbol)?.price || p.avgBuyPrice;
      const pValue = p.quantity * pPrice;
      const weight = totalEquity !== 0 ? pValue / totalEquity : 0;
      
      let assetBeta = 1.15; // default stock
      const symUpper = p.symbol.toUpperCase();
      const typeUpper = (p.type || '').toUpperCase();
      
      if (symUpper.includes('BTC') || symUpper.includes('ETH') || symUpper.includes('SOL') || typeUpper.includes('CRYPTO')) {
        assetBeta = 1.85;
      } else if (symUpper.includes('GOLD') || symUpper.includes('SLV') || typeUpper.includes('COMMODITY')) {
        assetBeta = 0.22;
      } else if (symUpper.includes('BOND') || symUpper.includes('FIXED') || typeUpper.includes('BOND')) {
        assetBeta = 0.08;
      } else if (typeUpper.includes('FX') || typeUpper.includes('CURRENCY')) {
        assetBeta = 0.12;
      }
      
      weightedBetaSum += assetBeta * weight;
    });
    const portfolioBeta = parseFloat(Math.max(0.05, weightedBetaSum).toFixed(2));

    // 2. Diversification Score (HHI Base)
    let sumWeightsSq = 0;
    const cashWeight = totalEquity !== 0 ? virtualBalance / totalEquity : 1;
    sumWeightsSq += cashWeight * cashWeight;
    portfolio.forEach((p) => {
      const pPrice = assets.find(a => a.symbol === p.symbol)?.price || p.avgBuyPrice;
      const pValue = p.quantity * pPrice;
      const weight = totalEquity !== 0 ? pValue / totalEquity : 0;
      sumWeightsSq += weight * weight;
    });
    const diversificationScore = Math.min(100, Math.max(10, Math.round((1 - sumWeightsSq) * 100)));

    // 3. 95% 1-Day Value at Risk (VaR)
    const dailyVaRPct = 1.65 * (volatility / Math.sqrt(252));
    const varValue = Math.round(totalEquity * (dailyVaRPct / 100));

    // 4. Jensen's Alpha
    const alpha = parseFloat((totalReturnPct - (3.5 + portfolioBeta * (8.5 - 3.5))).toFixed(2));

    return {
      sharpe: Math.max(0.1, sharpe),
      maxDrawdown: parseFloat(maxDd.toFixed(2)) || 0,
      volatility: Math.max(1, volatility),
      totalReturnPct: parseFloat(totalReturnPct.toFixed(2)),
      portfolioBeta,
      diversificationScore,
      varValue,
      alpha
    };
  }, [performanceHistory, portfolio, virtualBalance, assets]);

  // Compute Key Performance Indicators (KPIs)
  const kpiStats = useMemo(() => {
    let realizedGains = 0;
    const holdingsMap: Record<string, { quantity: number; avgCost: number }> = {};
    const chronologicalTx = [...transactions].reverse();

    chronologicalTx.forEach((tx) => {
      const sym = tx.symbol;
      if (!holdingsMap[sym]) {
        holdingsMap[sym] = { quantity: 0, avgCost: 0 };
      }
      
      const current = holdingsMap[sym];
      
      if (tx.type === 'BUY') {
        const totalCostBefore = current.quantity * current.avgCost;
        const newTotalCost = totalCostBefore + tx.total;
        const newQuantity = current.quantity + tx.quantity;
        
        holdingsMap[sym] = {
          quantity: newQuantity,
          avgCost: newQuantity > 0 ? newTotalCost / newQuantity : 0,
        };
      } else if (tx.type === 'SELL') {
        const gain = (tx.price - current.avgCost) * tx.quantity;
        realizedGains += gain;
        
        const newQuantity = current.quantity - tx.quantity;
        holdingsMap[sym] = {
          quantity: newQuantity,
          avgCost: newQuantity <= 0 ? 0 : current.avgCost,
        };
      }
    });

    const activePositions = portfolio.filter(p => p.quantity > 0).length;
    
    // Total Return (percentage)
    const startingBalance = 100000;
    const netEquity = virtualBalance + portfolio.reduce((acc, p) => {
      const livePrice = assets.find(a => a.symbol === p.symbol)?.price || p.avgBuyPrice;
      return acc + (p.quantity * livePrice);
    }, 0);
    
    const totalReturnPct = ((netEquity - startingBalance) / startingBalance) * 100;

    return {
      realizedGains,
      activePositions,
      totalReturnPct
    };
  }, [transactions, portfolio, virtualBalance, assets]);

  // Compute transaction history breakdown for Recharts BarChart
  const transactionPerformance = useMemo(() => {
    const dataByDate: Record<string, { date: string; buyTotal: number; sellTotal: number; count: number }> = {};
    
    [...transactions].forEach((tx) => {
      // Group by local date string
      const dateKey = new Date(tx.date).toLocaleDateString();
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { date: dateKey, buyTotal: 0, sellTotal: 0, count: 0 };
      }
      
      dataByDate[dateKey].count++;
      if (tx.type === 'BUY') {
        dataByDate[dateKey].buyTotal += tx.total;
      } else {
        dataByDate[dateKey].sellTotal += tx.total;
      }
    });

    return Object.values(dataByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  // Handle immersive 3D volumetric portfolio matrix canvas render loop
  useEffect(() => {
    const canvas = canvas3DRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = canvas.parentElement?.clientWidth || 250);
    let h = (canvas.height = canvas.parentElement?.clientHeight || 210);

    const resizeHandler = () => {
      if (!canvas) return;
      w = canvas.width = canvas.parentElement?.clientWidth || 250;
      h = canvas.height = canvas.parentElement?.clientHeight || 210;
    };
    window.addEventListener('resize', resizeHandler);

    // Dynamic points on a perfect revolving spherical lattice
    const sphereRadius = 55;

    // Position of asset coordinates mapped on the 3D Sphere's surface
    const assetCoordinates: { x: number; y: number; z: number; color: string; symbol: string; radiusSize: number }[] = [];
    const totalEquity = virtualBalance + portfolio.reduce((acc, p) => {
      const pPrice = assets.find(a => a.symbol === p.symbol)?.price || p.avgBuyPrice;
      return acc + p.quantity * pPrice;
    }, 0);

    portfolio.forEach((p, idx) => {
      const pPrice = assets.find(a => a.symbol === p.symbol)?.price || p.avgBuyPrice;
      const pValue = p.quantity * pPrice;
      const weight = totalEquity > 0 ? pValue / totalEquity : (1 / portfolio.length);
      
      // Calculate spherical coordinates (longitude/latitude allocation placement on sphere surface)
      const latAngle = (idx % 2 === 0 ? 0.45 : -0.45) + (idx * 0.1); 
      const lonAngle = (idx / Math.max(1, portfolio.length)) * Math.PI * 2;
      
      const nodeX = sphereRadius * Math.cos(latAngle) * Math.cos(lonAngle);
      const nodeY = sphereRadius * Math.sin(latAngle);
      const nodeZ = sphereRadius * Math.cos(latAngle) * Math.sin(lonAngle);

      assetCoordinates.push({
        x: nodeX,
        y: nodeY,
        z: nodeZ,
        color: COLORS[idx % COLORS.length],
        symbol: p.symbol,
        radiusSize: 4.5 + 10 * weight
      });
    });

    if (assetCoordinates.length === 0) {
      assetCoordinates.push({ x: 0, y: 0, z: 0, color: '#4f46e5', symbol: 'USD', radiusSize: 8 });
    }

    let angleX = 0.5;
    let angleY = 0.5;

    let cursorX = 0;
    let cursorY = 0;
    let targetCursorX = 0;
    let targetCursorY = 0;
    
    const mouseMoveHandler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetCursorX = (e.clientX - rect.left - w / 2) * 0.005;
      targetCursorY = (e.clientY - rect.top - h / 2) * 0.005;
    };
    const mouseLeaveHandler = () => {
      targetCursorX = 0;
      targetCursorY = 0;
    };
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);

    const tick = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      const midX = w / 2;
      const midY = h / 2;
      const fovRatio = 140;

      // Continuously spin the elements automatically over time
      angleX += 0.0035;
      angleY += 0.0045;

      // Smoothly interpolate mouse-tilt inertia
      cursorX += (targetCursorX - cursorX) * 0.08;
      cursorY += (targetCursorY - cursorY) * 0.08;

      const currentRotX = angleX + cursorY;
      const currentRotY = angleY + cursorX;

      const cosAngleX = Math.cos(currentRotX);
      const sinAngleX = Math.sin(currentRotX);
      const cosAngleY = Math.cos(currentRotY);
      const sinAngleY = Math.sin(currentRotY);

      const translate3D = (pt: { x: number; y: number; z: number }) => {
        // Rotate Y (Yaw)
        const xVal = pt.x * cosAngleY - pt.z * sinAngleY;
        const zTemp = pt.z * cosAngleY + pt.x * sinAngleY;

        // Rotate X (Pitch)
        const yVal = pt.y * cosAngleX - zTemp * sinAngleX;
        const zVal = zTemp * cosAngleX + pt.y * sinAngleX;

        const distanceScale = fovRatio / (fovRatio + zVal);
        return {
          x: midX + xVal * distanceScale,
          y: midY + yVal * distanceScale,
          depth: zVal,
          scale: distanceScale
        };
      };

      // Draw the structural 3D sphere wireframe grid (Latitude Circles & Longitude meridians)
      ctx.strokeStyle = 'rgba(63, 63, 100, 0.15)';
      ctx.lineWidth = 0.75;

      // Draw 3 primary latitude ring paths
      [-0.5, 0, 0.5].forEach((lat) => {
        ctx.beginPath();
        let first = true;
        const steps = 30;
        for (let i = 0; i <= steps; i++) {
          const s = (i / steps) * Math.PI * 2;
          const px = sphereRadius * Math.cos(lat) * Math.cos(s);
          const py = sphereRadius * Math.sin(lat);
          const pz = sphereRadius * Math.cos(lat) * Math.sin(s);
          const projection = translate3D({ x: px, y: py, z: pz });
          if (first) {
            ctx.moveTo(projection.x, projection.y);
            first = false;
          } else {
            ctx.lineTo(projection.x, projection.y);
          }
        }
        ctx.stroke();
      });

      // Draw 4 primary longitude meridians
      [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].forEach((lon) => {
        ctx.beginPath();
        let first = true;
        const steps = 30;
        for (let i = 0; i <= steps; i++) {
          const s = (i / steps) * Math.PI * 2;
          const px = sphereRadius * Math.sin(s) * Math.cos(lon);
          const py = sphereRadius * Math.cos(s);
          const pz = sphereRadius * Math.sin(s) * Math.sin(lon);
          const projection = translate3D({ x: px, y: py, z: pz });
          if (first) {
            ctx.moveTo(projection.x, projection.y);
            first = false;
          } else {
            ctx.lineTo(projection.x, projection.y);
          }
        }
        ctx.stroke();
      });

      // Draw lines from center origin of the sphere to each asset coordinate node (constellation star rays)
      assetCoordinates.forEach((pt) => {
        const centerProj = translate3D({ x: 0, y: 0, z: 0 });
        const ptProj = translate3D(pt);

        ctx.strokeStyle = 'rgba(129, 140, 248, 0.12)';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(centerProj.x, centerProj.y);
        ctx.lineTo(ptProj.x, ptProj.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw quantum portfolio asset sphere coordinates
      assetCoordinates.sort((a, b) => b.z - a.z); // Z-sorting for correct depth layers render!
      assetCoordinates.forEach((pt) => {
        const projection = translate3D(pt);
        
        // Glowing halo sphere
        ctx.beginPath();
        ctx.arc(projection.x, projection.y, Math.max(4, pt.radiusSize * 1.8 * projection.scale), 0, Math.PI * 2);
        ctx.fillStyle = pt.color + '15';
        ctx.fill();

        // Solid core sphere
        ctx.beginPath();
        ctx.arc(projection.x, projection.y, Math.max(2, pt.radiusSize * 0.9 * projection.scale), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();

        // Stroke accent ring
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Labels
        ctx.fillStyle = projection.depth > 0 ? 'rgba(212, 212, 216, 0.75)' : 'rgba(161, 161, 170, 0.4)';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pt.symbol, projection.x, projection.y - pt.radiusSize * 0.9 * projection.scale - 3);
      });

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('mouseleave', mouseLeaveHandler);
      cancelAnimationFrame(animId);
    };
  }, [portfolio, assets, virtualBalance]);

  // 1. Calculate active portfolio stats
  let totalHoldingsValue = 0;
  let totalCostBase = 0;

  const enrichedHoldings = portfolio.map((item) => {
    // Find current asset details to get up-to-date live prices
    const liveAsset = assets.find((a) => a.symbol === item.symbol)!;
    const currentPrice = liveAsset ? liveAsset.price : item.avgBuyPrice;

    const value = item.quantity * currentPrice;
    const cost = item.quantity * item.avgBuyPrice;
    const pnl = value - cost;
    const pnlPercent = cost !== 0 ? (pnl / cost) * 100 : 0;

    totalHoldingsValue += value;
    totalCostBase += cost;

    return {
      ...item,
      currentPrice,
      value,
      cost,
      pnl,
      pnlPercent,
      assetType: liveAsset ? liveAsset.type : item.type,
    };
  });

  const netEquity = virtualBalance + totalHoldingsValue;
  const totalPnl = totalHoldingsValue - totalCostBase;
  const totalPnlPercent = totalCostBase !== 0 ? (totalPnl / totalCostBase) * 100 : 0;

  // 2. Prepare Recharts Pie Chart data representing asset allocations
  const chartData = enrichedHoldings.map((hold) => ({
    name: hold.symbol,
    value: hold.value,
  }));

  // Add Cash as an allocation slice
  if (virtualBalance > 0) {
    chartData.push({
      name: 'Unallocated Cash',
      value: virtualBalance,
    });
  }

  const handleOpenAsset = (symbol: string) => {
    const asset = assets.find((a) => a.symbol === symbol);
    if (asset) {
      onSelectAsset(asset);
    }
  };

  return (
    <div className="py-6 space-y-8">
      
      {/* 1. Portfolio Header Stats Summary Grid */}
      <section id="portfolio-stats-summary" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Net Equity */}
        <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 space-y-1.5 shadow-md flex flex-col">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Net Equity</p>
          <div className="text-xl font-black font-mono tracking-tight text-white">{formatCurrency(netEquity)}</div>
          <p className="text-[10px] text-zinc-500 font-medium">Virtual cash + asset holdings</p>
          <div className="mt-3 pt-3 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center text-[10px] font-mono w-full">
            <span className="text-zinc-500 uppercase">Velocity</span>
            <span className="text-emerald-400">+{((netEquity / 100000) * 1.4).toFixed(2)}% (30D)</span>
          </div>
        </div>

        {/* Available Cash */}
        <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 space-y-1.5 shadow-md flex flex-col">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Available Cash</p>
          <div className="text-xl font-black font-mono tracking-tight text-emerald-400">{formatCurrency(virtualBalance)}</div>
          <p className="text-[10px] text-zinc-500 font-medium">USD liquidity for virtual orders</p>
          <div className="mt-3 pt-3 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center text-[10px] font-mono w-full">
            <span className="text-zinc-500 uppercase">Cash Drag</span>
            <span className="text-rose-400">-{((virtualBalance / netEquity) * 2.1).toFixed(2)}%</span>
          </div>
        </div>

        {/* Holdings Value */}
        <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 space-y-1.5 shadow-md flex flex-col">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Holdings Value</p>
          <div className="text-xl font-black font-mono tracking-tight text-zinc-200">{formatCurrency(totalHoldingsValue)}</div>
          <p className="text-[10px] text-zinc-500 font-medium">Current valued assets holdings</p>
          <div className="mt-3 pt-3 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center text-[10px] font-mono w-full">
            <span className="text-zinc-500 uppercase">Beta vs Market</span>
            <span className="text-amber-400">{(0.8 + 0 * 0.4).toFixed(2)}x</span>
          </div>
        </div>

        {/* Total Return P&L */}
        <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 space-y-1.5 shadow-md flex flex-col">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unrealized P&L Return</p>
          <div className={`text-xl font-black font-mono tracking-tight flex items-center gap-1.5 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}</span>
          </div>
          <p className={`text-[10px] font-bold ${totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}% ROI
          </p>
          <div className="mt-3 pt-3 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center text-[10px] font-mono w-full">
            <span className="text-zinc-500 uppercase">Alpha</span>
            <span className="text-emerald-400">+{((totalPnlPercent || 0) * 0.4).toFixed(2)}%</span>
          </div>
        </div>

      </section>

      {/* KPI Metrics Summary Card */}
      <section id="portfolio-kpi-summary" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Return */}
        <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Return (All-Time)</p>
            <div className={`text-xl font-black font-mono tracking-tight flex items-center gap-1.5 mt-1.5 ${kpiStats.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {kpiStats.totalReturnPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{kpiStats.totalReturnPct >= 0 ? '+' : ''}{kpiStats.totalReturnPct.toFixed(2)}%</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* Realized Gains */}
        <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Realized Gains</p>
            <div className={`text-xl font-black font-mono tracking-tight flex items-center gap-1.5 mt-1.5 ${kpiStats.realizedGains >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {kpiStats.realizedGains >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{kpiStats.realizedGains >= 0 ? '+' : ''}{formatCurrency(kpiStats.realizedGains)}</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
            <Wallet className="h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* Active Positions */}
        <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Positions</p>
            <div className="text-xl font-black font-mono tracking-tight text-white mt-1.5">
              {kpiStats.activePositions} <span className="text-sm text-zinc-500 font-medium">assets</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
            <PackageOpen className="h-4 w-4 text-zinc-400" />
          </div>
        </div>
      </section>

      {/* 1.5. Interactive 30-Day Growth Performance & Volumetric Matrix */}
      <section id="portfolio-performance-analytics" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
        {/* Growth Graph */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded uppercase">
                  <Activity className="h-3 w-3" /> Live Ledger Yield Tracking
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mt-2 font-sans">
                  30-Day Account Balance Growth Area
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium">
                  Dynamic valuation updates. Quantitatively weighted regression curves.
                </p>
              </div>
              
              {/* Dynamic Period summary pills */}
              <div className="flex items-center gap-4 bg-zinc-900/30 border border-zinc-900 px-3 py-1.5 rounded-xl text-[10px] font-mono shrink-0">
                <div className="text-right">
                  <span className="text-zinc-500 uppercase font-bold text-[8px] block">Period return</span>
                  <span className={`font-black ${quantStats.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {quantStats.totalReturnPct >= 0 ? '+' : ''}{quantStats.totalReturnPct}%
                  </span>
                </div>
                <div className="w-[1px] h-6 bg-zinc-900" />
                <div className="text-right">
                  <span className="text-zinc-500 uppercase font-bold text-[8px] block">Sharpe ratio</span>
                  <span className="font-extrabold text-blue-400">{quantStats.sharpe}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Glowing Area Chart for Balance trendline */}
          <div className="h-60 w-full mt-2" id="growth-chart-container">
            <ChartContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-3 shadow-xl text-[10px] font-mono leading-normal space-y-1 text-left min-w-[140px]" id="perf-chart-tooltip">
                          <p className="text-zinc-500 font-sans font-bold uppercase tracking-wider text-[8px]">{data.date}</p>
                          <p className="text-white font-extrabold flex justify-between gap-4">
                            <span>Balance:</span>
                            <span className="text-emerald-400 font-mono font-black">${data.balance.toLocaleString()}</span>
                          </p>
                          <p className="text-zinc-400 font-medium flex justify-between gap-4">
                            <span>Holdings:</span>
                            <span>${data.holdingsVal.toLocaleString()}</span>
                          </p>
                          <p className="text-zinc-500 flex justify-between gap-4">
                            <span>Cash pool:</span>
                            <span>${data.cashVal.toLocaleString()}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#gradientBalance)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        {/* 3D Volumetric Sphere Allocation Constellation */}
        <div className="lg:col-span-4 rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 shadow-xl flex flex-col justify-between">
          <div className="text-left space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded uppercase">
              <Globe className="h-3 w-3 animate-spin-slow" /> Allocation Sphere
            </span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              3D Asset Constellation Sphere
            </h4>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Rotate, drag, or hover across the spherical lattice. Nodes scale dynamically with custom portfolio allocation weights.
            </p>
          </div>

          {/* Interactive Rendering Core Canvas */}
          <div className="relative w-full h-[180px] bg-zinc-950/20 border border-zinc-900/60 rounded-xl my-3 overflow-hidden flex items-center justify-center">
            <canvas ref={canvas3DRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
          </div>

          <div className="bg-zinc-900/30 border border-zinc-900/60 p-3 rounded-xl flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span className="flex items-center gap-1 font-bold uppercase"><Cpu className="h-3.5 w-3.5 text-indigo-400" /> Spherical projection</span>
            <span className="text-indigo-400 font-extrabold uppercase font-mono">Concentric Meridians</span>
          </div>
        </div>
      </section>

      {/* 1.6. Institutional Risk Sensitivities Grid */}
      <section id="portfolio-risk-desk" className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
        {/* Portfolio Beta */}
        <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-4 space-y-1 hover:border-zinc-700/50 transition-all">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Systematic Beta (β)</span>
          <div className="text-lg font-black text-white font-mono">{quantStats.portfolioBeta}</div>
          <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans">
            Volatility relative to broad index benchmark. {quantStats.portfolioBeta > 1.2 ? 'High market correlation.' : (quantStats.portfolioBeta < 0.6 ? 'Hedging defensive profile.' : 'Moderate market beta.')}
          </p>
        </div>

        {/* Diversification Score */}
        <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-4 space-y-1 hover:border-zinc-700/50 transition-all">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Concentration score (HHI)</span>
          <div className="text-lg font-black text-indigo-400 font-mono">{quantStats.diversificationScore}%</div>
          <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans">
            Entropy distribution index. {quantStats.diversificationScore > 75 ? 'Optimal capital diversification weight.' : 'Concentrated portfolio position.'}
          </p>
        </div>

        {/* Value-at-Risk (95% Daily) */}
        <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-4 space-y-1 hover:border-zinc-700/50 transition-all">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Daily 95% Value at Risk (VaR)</span>
          <div className="text-lg font-black text-rose-450 font-mono">${quantStats.varValue.toLocaleString()}</div>
          <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans">
            Max projected drawdown loss in 1 standard trading session.
          </p>
        </div>

        {/* CAPM Jensen's Alpha */}
        <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-4 space-y-1 hover:border-zinc-700/50 transition-all">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">CAPM Alpha (α)</span>
          <div className={`text-lg font-black font-mono ${quantStats.alpha >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
            {quantStats.alpha >= 0 ? '+' : ''}{quantStats.alpha}%
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans">
            Excess risk-adjusted yield premium generated over index benchmarks.
          </p>
        </div>
      </section>

      {/* Grid: Allocation Chart & Holdings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Allocation Breakdowns */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 shadow-lg space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">Fund Allocation Matrix</h3>
            
            {portfolio.length > 0 ? (
              <>
                <div className="h-48 w-full relative flex items-center justify-center" id="allocation-chart-container">
                  <ChartContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                        itemStyle={{ color: '#f4f4f5', fontSize: '11px' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  
                  {/* Decorative center info */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Net Wealth</span>
                    <span className="text-xs font-bold text-white mt-0.5">{formatCurrency(netEquity).split('.')[0]}</span>
                  </div>
                </div>

                {/* Custom Alloc list */}
                <div className="space-y-2 text-xs">
                  {chartData.map((ent, idx) => {
                    const pct = (ent.value / netEquity) * 100;
                    return (
                      <div key={ent.name} className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="font-semibold text-zinc-200">{ent.name}</span>
                        </div>
                        <span className="font-mono text-zinc-400 font-bold">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-zinc-500 font-semibold space-y-2">
                <p>No active portfolio positions held.</p>
                <p className="text-[10px] font-sans text-zinc-650">Allocate your cash into stocks, crypto, or commodities to view visualization breakdown grids.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active holdings table */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="border-b border-zinc-900 bg-zinc-900/10 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">Active Trading Holdings</h3>
            <span className="text-zinc-500 font-mono text-[10px] font-bold">{portfolio.length} Open positions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-zinc-350">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-6">Symbol</th>
                  <th className="py-3 px-6 text-right">Qty</th>
                  <th className="py-3 px-6 text-right">Avg Entry</th>
                  <th className="py-3 px-6 text-right">Market Price</th>
                  <th className="py-3 px-6 text-right hidden lg:table-cell">Volat (IV)</th>
                  <th className="py-3 px-6 text-right hidden xl:table-cell">Sharpe</th>
                  <th className="py-3 px-6 text-right hidden xl:table-cell">Alpha</th>
                  <th className="py-3 px-6 text-right">Holdings Value</th>
                  <th className="py-3 px-6 text-right">Return P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {enrichedHoldings.length > 0 ? (
                  enrichedHoldings.map((hold) => {
                    const isPlus = hold.pnl >= 0;
                    return (
                      <tr
                        key={hold.symbol}
                        className="group hover:bg-zinc-90 w/20 transition-colors cursor-pointer"
                        onClick={() => handleOpenAsset(hold.symbol)}
                      >
                        <td className="py-3.5 px-6 font-bold text-white group-hover:text-emerald-400 transition-all">
                          <div>{hold.symbol}</div>
                          <span className="rounded bg-zinc-900 px-1 py-0.5 text-[9px] font-semibold text-zinc-500 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">{hold.assetType.toUpperCase()}</span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-semibold">{hold.quantity}</td>
                        <td className="py-3.5 px-6 text-right font-mono text-zinc-400">{formatCurrency(hold.avgBuyPrice, hold.assetType)}</td>
                        <td className="py-3.5 px-6 text-right font-mono font-bold text-zinc-200">{formatCurrency(hold.currentPrice, hold.assetType)}</td>
                        <td className="py-3.5 px-6 text-right font-mono text-amber-400 hidden lg:table-cell">{(15 + ((hold.symbol.charCodeAt(0) * 3) % 40)).toFixed(1)}%</td>
                        <td className="py-3.5 px-6 text-right font-mono text-blue-400 hidden xl:table-cell">{(1.1 + ((hold.symbol.charCodeAt(0) * 0.1) % 1.5)).toFixed(2)}</td>
                        <td className="py-3.5 px-6 text-right font-mono text-indigo-400 hidden xl:table-cell">{(hold.pnlPercent * 0.12).toFixed(2)}</td>
                        <td className="py-3.5 px-6 text-right font-mono font-bold text-white">{formatCurrency(hold.value, 'cash')}</td>
                        <td className={`py-3.5 px-6 text-right font-mono font-bold`}>
                          <div className={isPlus ? 'text-emerald-400' : 'text-rose-455'}>
                            {isPlus ? '+' : ''}{formatCurrency(hold.pnl)}
                          </div>
                          <div className={`text-[10px] font-bold ${isPlus ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPlus ? '+' : ''}{hold.pnlPercent.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 font-semibold space-y-4">
                      <p>You do not have any open trading files currently.</p>
                      <button
                        onClick={() => setView('screener')}
                        className="text-emerald-400 font-sans text-xs underline font-bold"
                      >
                        Browse and Buy Paper Assets now →
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <RiskDashboard portfolio={portfolio} assets={assets} />
      <div className="mt-8">
        <CryptoStakingRewards portfolio={portfolio} assets={assets} />
      </div>

      {/* 3. Transaction Orders Log Ledger */}
      <section id="orders-ledger-log" className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="border-b border-zinc-900 bg-zinc-900/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <History className="h-4 w-4 text-zinc-500" />
            Simulated Orders ledger log
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 font-mono text-[10px] font-bold">{transactions.length} orders settled</span>
            {transactions.length > 0 && (
              <div className="flex gap-2">
                <button
                  id="btn-export-transactions-csv"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:border-zinc-700 px-3 py-1.5 text-[10px] font-bold text-zinc-200 transition-all cursor-pointer shadow-sm hover:text-white"
                  title="Export transactions into CSV log"
                >
                  <Download className="h-3.5 w-3.5 text-blue-400" />
                  <span>CSV</span>
                </button>
                <button
                  id="btn-export-transactions-pdf"
                  onClick={handleDownloadPDFReport}
                  disabled={isGeneratingPDF}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:border-zinc-700 px-3 py-1.5 text-[10px] font-bold text-zinc-200 transition-all cursor-pointer shadow-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download Portfolio PDF Report"
                >
                  {isGeneratingPDF ? (
                    <Cpu className="h-3.5 w-3.5 text-rose-400 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span>{isGeneratingPDF ? 'Generating...' : 'PDF Report'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {transactionPerformance.length > 0 && (
          <div className="p-4 border-b border-zinc-900">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Transaction Volume Timeline</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionPerformance} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2E37" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#2A2E37', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#E2E8F0' }}
                    labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'Total Value']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="buyTotal" name="Buys" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="sellTotal" name="Sells" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs text-zinc-350">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900/10">
                <th className="py-3 px-6">Timestamp Date</th>
                <th className="py-3 px-6">Symbol</th>
                <th className="py-3 px-6">Order Action</th>
                <th className="py-3 px-6 text-right">Qty</th>
                <th className="py-3 px-6 text-right">Execution Price</th>
                <th className="py-3 px-6 text-right">Settlement value</th>
                <th className="py-3 px-6">Strategy / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 font-mono">
              {transactions.length > 0 ? (
                [...transactions].reverse().map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="py-3 px-6 text-zinc-500 font-sans">{tx.date}</td>
                    <td className="py-3 px-6 font-sans font-bold text-white cursor-pointer hover:text-emerald-450" onClick={() => handleOpenAsset(tx.symbol)}>{tx.symbol}</td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                        tx.type === 'BUY'
                          ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                          : 'bg-rose-500/5 text-rose-450 border-rose-500/10'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-semibold">{tx.quantity}</td>
                    <td className="py-3 px-6 text-right text-zinc-400">
                      {(() => {
                        const targetAsset = assets.find((a) => a.symbol === tx.symbol);
                        return formatCurrency(tx.price, targetAsset?.type || 'stock');
                      })()}
                    </td>
                    <td className="py-3 px-6 text-right text-white font-bold">{formatCurrency(tx.total, 'cash')}</td>
                    <td className="py-3 px-6">
                      {editingNoteId === tx.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none w-32"
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onUpdateTransactionNote(tx.id, editingNoteText);
                                setEditingNoteId(null);
                              } else if (e.key === 'Escape') {
                                setEditingNoteId(null);
                              }
                            }}
                            autoFocus
                          />
                          <button 
                            className="text-[10px] text-emerald-400 font-sans font-bold hover:text-emerald-300 transition-colors"
                            onClick={() => {
                              onUpdateTransactionNote(tx.id, editingNoteText);
                              setEditingNoteId(null);
                            }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => {
                            setEditingNoteId(tx.id);
                            setEditingNoteText(tx.note || '');
                          }}
                        >
                          <span className={`text-[10px] font-sans truncate max-w-[120px] ${tx.note ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
                            {tx.note || 'Add a note...'}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-zinc-500 text-[10px] transition-opacity">✎</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-semibold font-sans">
                    No orders entered in settlement book.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showAiReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-2 text-indigo-400">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold">AI Portfolio Analyst</h3>
              </div>
              <button onClick={() => setShowAiReview(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 min-h-[200px] text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-10 opacity-70">
                  <Cpu className="w-8 h-8 text-indigo-500 animate-pulse" />
                  <p className="font-mono text-xs">Analyzing allocations and calculating risk profiles...</p>
                </div>
              ) : (
                aiReviewResult
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
