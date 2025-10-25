const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PortfolioSchema = new mongoose.Schema({
  userId: String,
  ticker: String,
  shares: Number,
  entryPrice: Number,
  currentPrice: Number,
}, { collection: 'portfolios' });

const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

async function checkAllStocksSectors() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all unique tickers from the database
    const allPortfolios = await Portfolio.find({});
    const uniqueTickers = [...new Set(allPortfolios.map(p => p.ticker))];
    
    console.log(`\n📊 Found ${uniqueTickers.length} unique stocks in database`);
    console.log('='.repeat(80));
    
    // Group by ticker and show user info
    const tickerMap = {};
    allPortfolios.forEach(p => {
      if (!tickerMap[p.ticker]) {
        tickerMap[p.ticker] = {
          count: 0,
          users: new Set(),
          totalShares: 0
        };
      }
      tickerMap[p.ticker].count++;
      tickerMap[p.ticker].users.add(p.userId);
      tickerMap[p.ticker].totalShares += p.shares;
    });

    // Print all stocks
    console.log('\n📈 ALL STOCKS IN DATABASE:\n');
    Object.entries(tickerMap)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([ticker, data]) => {
        console.log(`  ${ticker.padEnd(8)} | Occurrences: ${data.count.toString().padStart(3)} | Users: ${data.users.size} | Total Shares: ${data.totalShares.toLocaleString()}`);
      });

    console.log('\n' + '='.repeat(80));
    
    // Now check sector mapping
    console.log('\n🏭 CHECKING SECTOR CLASSIFICATIONS:\n');
    
    // Import the sector service
    const { SectorLookupService } = require('../dist/services/sectorLookupService');
    const lookupService = SectorLookupService.getInstance();
    
    // Check each ticker's sector
    for (const ticker of uniqueTickers) {
      try {
        const sectorInfo = await lookupService.getSectorForStock(ticker);
        console.log(`  ${ticker.padEnd(8)} → ${sectorInfo.sector.padEnd(25)} (${sectorInfo.source})`);
      } catch (error) {
        console.log(`  ${ticker.padEnd(8)} → UNMAPPED (${error.message})`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkAllStocksSectors();
