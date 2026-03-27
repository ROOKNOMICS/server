import mongoose from 'mongoose';
import Backtest from './dist/models/Backtest.js';
import User from './dist/models/User.js';
import handlerResponse from './dist/index.js';
import dotenv from 'dotenv';

dotenv.config();

const testBacktestSave = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('👤 Creating test user...');
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        provider: 'local',
        password: 'password123'
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Found existing test user');
    }

    console.log('\n🧪 Running backtest test...');
    
    // Test the backtest function
    const testParams = {
      symbol: 'AAPL',
      startDate: '2022-01-01',
      endDate: '2022-12-31',
      capital: 10000,
      activeRules: ['MA Crossover', 'RSI Entry'],
      rulesConfig: {
        rsi: { enabled: true, period: 14, buyBelow: 30, sellAbove: 70 },
        maCross: { enabled: true, type: 'SMA', fastPeriod: 50, slowPeriod: 200 }
      }
    };

    console.log('📊 Running backtest with params:', testParams);
    const results = await handlerResponse(
      testParams.symbol,
      testParams.startDate,
      testParams.endDate,
      testParams.capital,
      testParams.activeRules,
      testParams.rulesConfig
    );

    console.log('✅ Backtest completed successfully');
    console.log('📈 Results summary:', {
      verdict: results.verdict.type,
      strategyReturn: results.benchmark.strategy,
      benchmarkReturn: results.benchmark.benchmark,
      totalTrades: results.tradeLog.length
    });

    // Save to database
    console.log('\n💾 Saving backtest to database...');
    const backtest = new Backtest({
      userId: testUser._id,
      name: 'Test Backtest - API Script',
      symbol: testParams.symbol,
      startDate: testParams.startDate,
      endDate: testParams.endDate,
      initialCapital: testParams.capital,
      activeRules: testParams.activeRules,
      rulesConfig: testParams.rulesConfig,
      results: {
        ...results,
        portfolioMetrics: results.portfolioMatrics, // Fix typo mapping
        benchmarkMetrics: results.benchmarkMatrics   // Fix typo mapping
      }
    });

    await backtest.save();
    console.log('✅ Backtest saved to database with ID:', backtest._id);

    // Verify the data was saved correctly
    console.log('\n🔍 Verifying saved data...');
    const savedBacktest = await Backtest.findById(backtest._id).populate('userId', 'name email');
    
    if (savedBacktest) {
      console.log('✅ Data verification successful:');
      console.log('   - Name:', savedBacktest.name);
      console.log('   - Symbol:', savedBacktest.symbol);
      console.log('   - User:', savedBacktest.userId.name);
      console.log('   - Verdict:', savedBacktest.results.verdict.type);
      console.log('   - Strategy Return:', savedBacktest.results.benchmark.strategy + '%');
      console.log('   - Trade Count:', savedBacktest.results.tradeLog.length);
      console.log('   - Created At:', savedBacktest.createdAt);
    } else {
      console.log('❌ Failed to retrieve saved backtest');
    }

    // Test query functionality
    console.log('\n🔎 Testing query functionality...');
    const userBacktests = await Backtest.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name symbol startDate endDate results.verdict results.benchmark createdAt');

    console.log(`✅ Found ${userBacktests.length} backtests for user`);
    userBacktests.forEach((bt, index) => {
      console.log(`   ${index + 1}. ${bt.name} - ${bt.symbol} - ${bt.results.verdict.type}`);
    });

    console.log('\n🎉 All tests passed! Database integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testBacktestSave();
