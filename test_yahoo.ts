import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const modules: any = ['defaultKeyStatistics', 'financialData'];
    const result = await yahooFinance.quoteSummary('AAPL', { modules });
    console.log(JSON.stringify({ success: true, data: result }, null, 2));
  } catch (err: any) {
    console.error(err);
  }
}

test();
