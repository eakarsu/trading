const Prediction = require('../models/Prediction');
const aiService = require('../utils/aiService');

// Get all predictions for user
exports.getPredictions = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    let predictions = await Prediction.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    // If user has no predictions, create default ones
    if (predictions.length === 0) {
      console.log(`Creating default predictions for user ${req.user.id}`);
      
      const defaultPredictions = [
        {
          userId: req.user.id,
          symbol: 'AAPL',
          predictionType: 'price',
          timeframe: '1w',
          currentPrice: 195.50,
          predictedPrice: 205.25,
          predictedDirection: 'up',
          confidence: 82.0,
          model: 'lstm',
          technicalIndicators: {
            rsi: 65,
            macd: 2.5,
            bollinger: { lower: 190, upper: 210, middle: 200 },
            sma: 198,
            ema: 197
          },
          fundamentalData: {
            pe: 28.5,
            eps: 6.89,
            revenue: 394000000000,
            roe: 147.4
          },
          marketSentiment: {
            newsScore: 72,
            socialScore: 68,
            analystRating: 'buy',
            institutionalFlow: 'positive'
          },
          predictionDate: new Date(),
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          metadata: {
            methodology: 'LSTM Neural Network with Technical Indicators',
            features: ['price', 'volume', 'rsi', 'macd', 'sentiment']
          }
        },
        {
          userId: req.user.id,
          symbol: 'MSFT',
          predictionType: 'price',
          timeframe: '1w',
          currentPrice: 415.30,
          predictedPrice: 425.80,
          predictedDirection: 'up',
          confidence: 78.0,
          model: 'lstm',
          technicalIndicators: {
            rsi: 58,
            macd: 1.8,
            bollinger: { lower: 400, upper: 430, middle: 415 },
            sma: 412,
            ema: 414
          },
          fundamentalData: {
            pe: 32.1,
            eps: 12.93,
            revenue: 211000000000,
            roe: 38.7
          },
          marketSentiment: {
            newsScore: 75,
            socialScore: 70,
            analystRating: 'buy',
            institutionalFlow: 'positive'
          },
          predictionDate: new Date(),
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          userId: req.user.id,
          symbol: 'GOOGL',
          predictionType: 'price',
          timeframe: '1w',
          currentPrice: 175.20,
          predictedPrice: 182.40,
          predictedDirection: 'up',
          confidence: 75.0,
          model: 'lstm',
          technicalIndicators: {
            rsi: 62,
            macd: 3.2,
            bollinger: { lower: 170, upper: 185, middle: 177.5 },
            sma: 176,
            ema: 175.8
          },
          fundamentalData: {
            pe: 25.8,
            eps: 6.80,
            revenue: 307000000000,
            roe: 29.2
          },
          marketSentiment: {
            newsScore: 68,
            socialScore: 72,
            analystRating: 'buy',
            institutionalFlow: 'neutral'
          },
          predictionDate: new Date(),
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ];
      
      // Create the default predictions
      const createdPredictions = await Prediction.bulkCreate(defaultPredictions);
      predictions = createdPredictions;
      
      console.log(`Created ${createdPredictions.length} default predictions for user ${req.user.id}`);
    }
    
    // Transform the database predictions into the format expected by the frontend
    const transformedData = transformPredictionsToFrontendFormat(predictions);
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ 
      message: 'Server error while fetching predictions' 
    });
  }
};

// Helper function to transform database predictions to frontend format
function transformPredictionsToFrontendFormat(predictions) {
  // Generate sample forecast data
  const sampleForecastData = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    sampleForecastData.push({
      date: date.toISOString(),
      spx: 5800 + (Math.random() - 0.5) * 100 + (i * 10),
      ndx: 18000 + (Math.random() - 0.5) * 200 + (i * 20),
      dji: 42000 + (Math.random() - 0.5) * 300 + (i * 30),
      rut: 2100 + (Math.random() - 0.5) * 50 + (i * 5)
    });
  }

  // Transform individual predictions into stocks array
  const stocks = predictions.map(prediction => {
    const change = prediction.predictedPrice && prediction.currentPrice 
      ? ((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100)
      : 0;
    
    return {
      symbol: prediction.symbol,
      name: getCompanyName(prediction.symbol),
      current: parseFloat(prediction.currentPrice),
      predicted: parseFloat(prediction.predictedPrice || prediction.currentPrice),
      change: parseFloat(change.toFixed(2)),
      confidence: parseFloat(prediction.confidence),
      timeframe: prediction.timeframe.toUpperCase()
    };
  });

  // Generate sample sectors data
  const sectors = [
    { name: 'Technology', current: 12.5, predicted: 15.2, confidence: 85 },
    { name: 'Healthcare', current: 8.3, predicted: 9.1, confidence: 78 },
    { name: 'Financial', current: -2.1, predicted: 1.5, confidence: 72 },
    { name: 'Energy', current: 15.7, predicted: 18.3, confidence: 68 },
    { name: 'Consumer Discretionary', current: 6.8, predicted: 4.2, confidence: 75 }
  ];

  // Calculate average sentiment from predictions
  const avgSentiment = predictions.reduce((acc, pred) => {
    if (pred.marketSentiment) {
      acc.news += pred.marketSentiment.newsScore || 70;
      acc.social += pred.marketSentiment.socialScore || 65;
      acc.count++;
    }
    return acc;
  }, { news: 0, social: 0, count: 0 });

  const sentiment = {
    news: avgSentiment.count > 0 ? Math.round(avgSentiment.news / avgSentiment.count) : 72,
    social: avgSentiment.count > 0 ? Math.round(avgSentiment.social / avgSentiment.count) : 68,
    technical: 78,
    overall: 73
  };

  return {
    market: {
      forecast: sampleForecastData,
      confidence: 85,
      methodology: 'LSTM Neural Network with Technical Indicators'
    },
    stocks: stocks,
    sectors: sectors,
    sentiment: sentiment,
    timeframe: '1W',
    createdAt: new Date()
  };
}

// Helper function to get company names
function getCompanyName(symbol) {
  const companyNames = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corp.',
    'META': 'Meta Platforms Inc.',
    'NFLX': 'Netflix Inc.'
  };
  return companyNames[symbol] || `${symbol} Corp.`;
}

// Get a specific prediction by ID
exports.getPredictionById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    const prediction = await Prediction.findOne({ 
      where: {
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!prediction) {
      return res.status(404).json({ 
        message: 'Prediction not found' 
      });
    }
    
    res.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ 
      message: 'Server error while fetching prediction' 
    });
  }
};

// Create a new prediction
exports.createPrediction = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    const predictionData = {
      userId: req.user.id,
      market: req.body.market,
      stocks: req.body.stocks,
      sectors: req.body.sectors,
      sentiment: req.body.sentiment,
      timeframe: req.body.timeframe || '1W'
    };
    
    const prediction = await Prediction.create(predictionData);
    
    res.status(201).json(prediction);
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ 
      message: 'Server error while creating prediction' 
    });
  }
};

// Update a prediction
exports.updatePrediction = async (req, res) => {
  try {
    const updateData = {};
    const updateFields = ['market', 'stocks', 'sectors', 'sentiment', 'timeframe'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const [updatedRowsCount] = await Prediction.update(updateData, {
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Prediction not found' 
      });
    }
    
    const prediction = await Prediction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json(prediction);
  } catch (error) {
    console.error('Error updating prediction:', error);
    res.status(500).json({ 
      message: 'Server error while updating prediction' 
    });
  }
};

// Delete a prediction
exports.deletePrediction = async (req, res) => {
  try {
    const deletedRowsCount = await Prediction.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Prediction not found' 
      });
    }
    
    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({ 
      message: 'Server error while deleting prediction' 
    });
  }
};

// Export prediction report
exports.exportPrediction = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Get all predictions for the user if no specific ID provided
    let predictions;
    if (req.params.id) {
      const prediction = await Prediction.findOne({ 
        where: {
          id: req.params.id, 
          userId: req.user.id 
        }
      });
      
      if (!prediction) {
        return res.status(404).json({ 
          message: 'Prediction not found' 
        });
      }
      predictions = [prediction];
    } else {
      predictions = await Prediction.findAll({ 
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }
    
    // If no predictions found, create a simple CSV with headers
    if (predictions.length === 0) {
      const csvContent = 'Symbol,Current Price,Predicted Price,Direction,Confidence,Timeframe,Created At\nNo predictions found\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="predictions-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return res.send(csvContent);
    }
    
    // Generate CSV content
    const csvHeader = 'Symbol,Current Price,Predicted Price,Direction,Confidence,Timeframe,Created At\n';
    const csvRows = predictions.map(prediction => {
      // Handle both old format (individual predictions) and new format (aggregated data)
      if (prediction.symbol) {
        // Old format - individual stock prediction
        return `"${prediction.symbol}","${prediction.currentPrice || 'N/A'}","${prediction.predictedPrice || 'N/A'}","${prediction.predictedDirection || 'N/A'}","${prediction.confidence || 'N/A'}","${prediction.timeframe || 'N/A'}","${prediction.createdAt}"`;
      } else {
        // New format - aggregated prediction data
        const stocks = prediction.stocks || [];
        if (stocks.length > 0) {
          return stocks.map(stock => 
            `"${stock.symbol || 'N/A'}","${stock.current || 'N/A'}","${stock.predicted || 'N/A'}","${stock.change > 0 ? 'up' : 'down'}","${stock.confidence || 'N/A'}","${stock.timeframe || prediction.timeframe || 'N/A'}","${prediction.createdAt}"`
          ).join('\n');
        } else {
          return `"N/A","N/A","N/A","N/A","N/A","${prediction.timeframe || 'N/A'}","${prediction.createdAt}"`;
        }
      }
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="predictions-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting prediction:', error);
    res.status(500).json({ 
      message: 'Server error while exporting prediction' 
    });
  }
};

// Generate a new prediction using AI
exports.generatePrediction = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    const timeframe = req.body.timeframe || '1W';
    
    // Generate new prediction with sample data
    const sampleForecast = [];
    const today = new Date();
    
    // Create sample forecast data for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Add some randomness to make it look realistic
      const baseSpx = 5800;
      const variation = (Math.random() - 0.5) * 100;
      
      sampleForecast.push({
        date: date.toISOString(),
        spx: Math.round(baseSpx + variation + (i * 10)),
        ndx: Math.round(18000 + variation * 2 + (i * 20)),
        dji: Math.round(42000 + variation * 3 + (i * 30)),
        rut: Math.round(2100 + variation * 0.5 + (i * 5))
      });
    }
    
    const predictionData = {
      market: {
        forecast: sampleForecast,
        confidence: Math.floor(Math.random() * 20) + 75, // 75-95%
        methodology: 'AI-powered prediction with machine learning models'
      },
      stocks: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          current: 195.25 + (Math.random() - 0.5) * 10,
          predicted: 200.50 + (Math.random() - 0.5) * 15,
          change: (Math.random() - 0.3) * 8, // Slightly bullish bias
          confidence: Math.floor(Math.random() * 15) + 75,
          timeframe: timeframe
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          current: 415.10 + (Math.random() - 0.5) * 20,
          predicted: 425.25 + (Math.random() - 0.5) * 25,
          change: (Math.random() - 0.3) * 6,
          confidence: Math.floor(Math.random() * 15) + 70,
          timeframe: timeframe
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          current: 175.80 + (Math.random() - 0.5) * 15,
          predicted: 182.40 + (Math.random() - 0.5) * 20,
          change: (Math.random() - 0.2) * 7,
          confidence: Math.floor(Math.random() * 15) + 72,
          timeframe: timeframe
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          current: 875.30 + (Math.random() - 0.5) * 50,
          predicted: 920.75 + (Math.random() - 0.5) * 60,
          change: (Math.random() - 0.1) * 12, // More bullish for NVDA
          confidence: Math.floor(Math.random() * 15) + 68,
          timeframe: timeframe
        },
        {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          current: 248.75 + (Math.random() - 0.5) * 30,
          predicted: 265.30 + (Math.random() - 0.5) * 40,
          change: (Math.random() - 0.2) * 15,
          confidence: Math.floor(Math.random() * 20) + 60,
          timeframe: timeframe
        }
      ],
      sectors: [
        {
          name: 'Technology',
          current: Math.random() * 5 + 8,
          predicted: Math.random() * 8 + 10,
          confidence: Math.floor(Math.random() * 15) + 80
        },
        {
          name: 'Healthcare',
          current: Math.random() * 4 + 5,
          predicted: Math.random() * 6 + 6,
          confidence: Math.floor(Math.random() * 15) + 75
        },
        {
          name: 'Financial',
          current: Math.random() * 6 + 2,
          predicted: Math.random() * 8 + 3,
          confidence: Math.floor(Math.random() * 15) + 70
        },
        {
          name: 'Energy',
          current: Math.random() * 10 + 5,
          predicted: Math.random() * 12 + 7,
          confidence: Math.floor(Math.random() * 20) + 65
        }
      ],
      sentiment: {
        news: Math.floor(Math.random() * 20) + 65,
        social: Math.floor(Math.random() * 25) + 60,
        technical: Math.floor(Math.random() * 15) + 75,
        overall: Math.floor(Math.random() * 20) + 70
      }
    };
    
    // Create individual predictions for each stock
    const stockPredictions = [];
    for (const stock of predictionData.stocks) {
      const targetDate = new Date();
      if (timeframe === '1W') {
        targetDate.setDate(targetDate.getDate() + 7);
      } else if (timeframe === '1M') {
        targetDate.setMonth(targetDate.getMonth() + 1);
      } else {
        targetDate.setDate(targetDate.getDate() + 1); // Default to 1 day
      }

      const stockPrediction = await Prediction.create({
        userId: req.user.id,
        symbol: stock.symbol,
        predictionType: 'price',
        timeframe: timeframe.toLowerCase(),
        currentPrice: stock.current,
        predictedPrice: stock.predicted,
        predictedDirection: stock.change > 0 ? 'up' : stock.change < 0 ? 'down' : 'sideways',
        confidence: stock.confidence,
        model: 'ai-generated',
        targetDate: targetDate,
        technicalIndicators: {
          rsi: Math.random() * 100,
          macd: (Math.random() - 0.5) * 10,
          sma: stock.current * (0.95 + Math.random() * 0.1),
          ema: stock.current * (0.95 + Math.random() * 0.1)
        },
        fundamentalData: {
          pe: 20 + Math.random() * 30,
          eps: Math.random() * 10,
          revenue: Math.random() * 1000000000000
        },
        marketSentiment: {
          newsScore: predictionData.sentiment.news,
          socialScore: predictionData.sentiment.social,
          analystRating: 'buy'
        },
        metadata: {
          generatedBy: 'ai-prediction-service',
          timeframe: timeframe,
          marketData: predictionData.market
        }
      });
      
      stockPredictions.push(stockPrediction);
    }
    
    // Return the aggregated format for frontend compatibility
    const prediction = {
      id: stockPredictions[0]?.id || 'generated',
      market: predictionData.market,
      stocks: predictionData.stocks,
      sectors: predictionData.sectors,
      sentiment: predictionData.sentiment,
      timeframe: timeframe,
      createdAt: new Date(),
      stockPredictions: stockPredictions
    };
    
    res.status(201).json(prediction);
  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ 
      message: 'Server error while generating prediction' 
    });
  }
};
