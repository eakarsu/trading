const axios = require('axios');
const { parseAIJson } = require('./parseAIJson');

// Canonical model IDs (audit fix: anthropic/claude-sonnet-4 is non-canonical).
// Use the OpenRouter slug + a reliable fallback when rate limited or 5xx.
const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'anthropic/claude-3-haiku';

// Simple in-memory prompt cache (key -> { value, expiresAt })
const PROMPT_CACHE = new Map();
const CACHE_TTL_MS = parseInt(process.env.AI_CACHE_TTL_MS || (15 * 60 * 1000), 10); // 15 min

function cacheKey(model, systemPrompt, prompt, temperature) {
  // Cheap, collision-resistant-enough key for prompt caching
  return `${model}::${temperature}::${systemPrompt.length}:${prompt.length}::${prompt.slice(0, 80)}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// OpenRouter AI Service — resilient client (retry, fallback, cache, telemetry)
class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.defaultModel = DEFAULT_MODEL;
    this.fallbackModel = FALLBACK_MODEL;
    this.requestCount = 0;
    this.errorCount = 0;
    this.cacheHits = 0;

    // Default headers for OpenRouter API
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'AI Trading Platform',
      'Content-Type': 'application/json'
    };
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      cacheHits: this.cacheHits,
      cacheSize: PROMPT_CACHE.size
    };
  }

  // Generic method to call OpenRouter API with retry + fallback + caching
  async callAI(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const systemPrompt = options.systemPrompt || 'You are an expert financial AI assistant.';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens || 1000;
    const useCache = options.useCache !== false;
    const timeoutMs = options.timeoutMs || 30000;

    // 1. Cache lookup
    const ck = cacheKey(model, systemPrompt, prompt, temperature);
    if (useCache) {
      const hit = PROMPT_CACHE.get(ck);
      if (hit && hit.expiresAt > Date.now()) {
        this.cacheHits++;
        return hit.value;
      }
      if (hit) PROMPT_CACHE.delete(ck);
    }

    const requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    };

    const maxRetries = options.maxRetries ?? 2;
    let lastErr;
    let currentModel = model;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.requestCount++;
        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          { ...requestBody, model: currentModel },
          { headers: this.headers, timeout: timeoutMs }
        );
        const content = response.data.choices[0].message.content;

        if (useCache) {
          PROMPT_CACHE.set(ck, { value: content, expiresAt: Date.now() + CACHE_TTL_MS });
        }
        return content;
      } catch (error) {
        this.errorCount++;
        lastErr = error;
        const status = error.response?.status;
        // Rate-limit or transient 5xx → backoff then retry, swap to fallback after first failure
        if ((status === 429 || (status >= 500 && status < 600) || error.code === 'ECONNABORTED') && attempt < maxRetries) {
          const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
          console.warn(`[AIService] ${status || error.code} on model=${currentModel}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(delay);
          if (currentModel !== this.fallbackModel) currentModel = this.fallbackModel;
          continue;
        }
        console.error('Error calling OpenRouter API:', error.response?.data || error.message);
        throw new Error(`AI service error: ${error.response?.data?.error?.message || error.message}`);
      }
    }
    throw lastErr;
  }

  // Convenience: call AI and parse JSON via 3-strategy parser
  async callAIJson(prompt, options = {}) {
    const raw = await this.callAI(prompt, options);
    const parsed = parseAIJson(raw, { fallback: null });
    if (parsed === null) {
      console.warn('[AIService] callAIJson: parseAIJson returned null, raw length=', raw?.length);
    }
    return { raw, parsed };
  }

  // Generate market analysis
  async generateMarketAnalysis(marketData, options = {}) {
    const prompt = `
      Analyze the following market data and provide a comprehensive market analysis:
      
      Indices: ${JSON.stringify(marketData.indices)}
      Stocks: ${JSON.stringify(marketData.stocks)}
      Commodities: ${JSON.stringify(marketData.commodities)}
      Currencies: ${JSON.stringify(marketData.currencies)}
      
      Please provide:
      1. Overall market sentiment
      2. Key trends and patterns
      3. Sector performance analysis
      4. Risk assessment
      5. Investment recommendations
      6. Technical indicators summary
      
      Format your response as JSON with the following structure:
      {
        "sentiment": "overall market sentiment",
        "trends": ["key trend 1", "key trend 2"],
        "sectors": {
          "technology": "performance analysis",
          "finance": "performance analysis",
          "healthcare": "performance analysis"
        },
        "risk": "risk assessment",
        "recommendations": ["recommendation 1", "recommendation 2"],
        "technical": {
          "rsi": "RSI analysis",
          "macd": "MACD analysis",
          "support_resistance": "key levels"
        }
      }
    `;

    const systemPrompt = 'You are an expert financial market analyst. Provide detailed, actionable market analysis based on the provided data.';
    
    return await this.callAI(prompt, {
      systemPrompt,
      model: options.model || DEFAULT_MODEL,
      temperature: 0.5,
      maxTokens: 2000
    });
  }

  // Generate trading strategy
  async generateTradingStrategy(portfolioData, marketData, options = {}) {
    const prompt = `
      Based on the following portfolio and market data, generate a comprehensive trading strategy:
      
      Portfolio: ${JSON.stringify(portfolioData)}
      Market Data: ${JSON.stringify(marketData)}
      
      Please provide:
      1. Strategy name and description
      2. Risk level (low/medium/high)
      3. Entry criteria
      4. Exit criteria
      5. Position sizing rules
      6. Risk management guidelines
      7. Expected performance metrics
      8. Backtesting recommendations
      
      Format your response as JSON with the following structure:
      {
        "name": "strategy name",
        "description": "strategy description",
        "riskLevel": "low/medium/high",
        "entryCriteria": ["criterion 1", "criterion 2"],
        "exitCriteria": ["criterion 1", "criterion 2"],
        "positionSizing": "position sizing rules",
        "riskManagement": "risk management guidelines",
        "expectedPerformance": {
          "winRate": "expected win rate",
          "avgReturn": "average return per trade",
          "maxDrawdown": "maximum expected drawdown"
        },
        "backtesting": "backtesting recommendations"
      }
    `;

    const systemPrompt = 'You are an expert quantitative trading strategist. Create detailed, profitable trading strategies based on the provided data.';
    
    return await this.callAI(prompt, {
      systemPrompt,
      model: options.model || DEFAULT_MODEL,
      temperature: 0.6,
      maxTokens: 2500
    });
  }

  // Generate market predictions
  async generateMarketPredictions(marketData, timeframe, options = {}) {
    const prompt = `
      Based on the following market data, generate predictions for the ${timeframe} timeframe:
      
      Market Data: ${JSON.stringify(marketData)}
      
      Please provide:
      1. Market direction predictions for major indices
      2. Top 5 stock picks with reasoning
      3. Sector rotation recommendations
      4. Key support and resistance levels
      5. Risk factors to monitor
      6. Confidence levels for each prediction
      
      Format your response as JSON with the following structure:
      {
        "market": {
          "forecast": [
            {
              "date": "current date",
              "spx": "current SPX value",
              "ndx": "current NDX value",
              "dji": "current DJI value",
              "rut": "current RUT value"
            },
            {
              "date": "date + 1 day",
              "spx": "predicted SPX value",
              "ndx": "predicted NDX value",
              "dji": "predicted DJI value",
              "rut": "predicted RUT value"
            },
            {
              "date": "date + 2 days",
              "spx": "predicted SPX value",
              "ndx": "predicted NDX value",
              "dji": "predicted DJI value",
              "rut": "predicted RUT value"
            },
            {
              "date": "date + 3 days",
              "spx": "predicted SPX value",
              "ndx": "predicted NDX value",
              "dji": "predicted DJI value",
              "rut": "predicted RUT value"
            },
            {
              "date": "date + 4 days",
              "spx": "predicted SPX value",
              "ndx": "predicted NDX value",
              "dji": "predicted DJI value",
              "rut": "predicted RUT value"
            }
          ],
          "confidence": "overall confidence level 0-100",
          "methodology": "methodology description"
        },
        "stocks": [
          {
            "symbol": "stock symbol",
            "name": "company name",
            "current": "current price",
            "predicted": "predicted price",
            "change": "absolute change",
            "confidence": "confidence level 0-100",
            "timeframe": "timeframe"
          }
        ],
        "sectors": [
          {
            "name": "sector name",
            "current": "current performance",
            "predicted": "predicted performance",
            "confidence": "confidence level 0-100"
          }
        ],
        "sentiment": {
          "news": "news sentiment 0-100",
          "social": "social sentiment 0-100",
          "technical": "technical sentiment 0-100",
          "overall": "overall sentiment 0-100"
        }
      }
    `;

    const systemPrompt = 'You are an expert market predictor and quantitative analyst. Provide accurate, data-driven market predictions in the exact JSON format specified.';
    
    return await this.callAI(prompt, {
      systemPrompt,
      model: options.model || DEFAULT_MODEL,
      temperature: 0.4,
      maxTokens: 2500
    });
  }

  // Portfolio analysis and recommendations
  async analyzePortfolio(portfolioData, marketData, options = {}) {
    const prompt = `
      Analyze the following portfolio in the current market context and provide recommendations:
      
      Portfolio: ${JSON.stringify(portfolioData)}
      Market Data: ${JSON.stringify(marketData)}
      
      Please provide:
      1. Portfolio performance assessment
      2. Risk analysis
      3. Diversification evaluation
      4. Asset allocation recommendations
      5. Specific buy/sell recommendations
      6. Rebalancing suggestions
      
      Format your response as JSON with the following structure:
      {
        "performance": {
          "totalValue": "current portfolio value",
          "change": "absolute change",
          "changePercent": "percentage change"
        },
        "risk": {
          "level": "risk level",
          "factors": ["risk factor 1", "risk factor 2"],
          "score": "risk score 0-100"
        },
        "diversification": {
          "score": "diversification score 0-100",
          "analysis": "diversification analysis"
        },
        "allocation": {
          "current": "current allocation breakdown",
          "recommended": "recommended allocation"
        },
        "recommendations": [
          {
            "action": "buy/sell/hold",
            "symbol": "asset symbol",
            "reasoning": "reasoning for recommendation"
          }
        ],
        "rebalancing": "rebalancing suggestions"
      }
    `;

    const systemPrompt = 'You are an expert portfolio manager and financial advisor. Provide comprehensive portfolio analysis and actionable recommendations.';
    
    return await this.callAI(prompt, {
      systemPrompt,
      model: options.model || DEFAULT_MODEL,
      temperature: 0.5,
      maxTokens: 2000
    });
  }

  // Risk assessment
  async assessRisk(portfolioData, marketData, options = {}) {
    const prompt = `
      Assess the risk profile for the following portfolio in the current market context:
      
      Portfolio: ${JSON.stringify(portfolioData)}
      Market Data: ${JSON.stringify(marketData)}
      
      Please provide:
      1. Overall risk score (0-100)
      2. Risk factors by category
      3. Value at Risk (VaR) estimation
      4. Maximum drawdown potential
      5. Correlation analysis
      6. Risk mitigation strategies
      
      Format your response as JSON with the following structure:
      {
        "overallScore": "risk score 0-100",
        "factors": {
          "marketRisk": "market risk assessment",
          "creditRisk": "credit risk assessment",
          "liquidityRisk": "liquidity risk assessment",
          "concentrationRisk": "concentration risk assessment"
        },
        "var": {
          "daily": "daily VaR amount",
          "weekly": "weekly VaR amount",
          "monthly": "monthly VaR amount"
        },
        "drawdown": {
          "maxPotential": "maximum potential drawdown percentage",
          "historical": "historical maximum drawdown"
        },
        "correlation": "correlation analysis",
        "mitigation": ["mitigation strategy 1", "mitigation strategy 2"]
      }
    `;

    const systemPrompt = 'You are an expert risk analyst. Provide detailed risk assessments and mitigation strategies.';
    
    return await this.callAI(prompt, {
      systemPrompt,
      model: options.model || DEFAULT_MODEL,
      temperature: 0.3,
      maxTokens: 1500
    });
  }

  // Trading assistant response
  async getTradingAssistantResponse(conversationHistory, context, options = {}) {
    const prompt = `
      You are a conversational trading assistant. The user has asked a question about trading.
      
      Conversation History: ${JSON.stringify(conversationHistory)}
      Context: ${JSON.stringify(context)}
      
      Please provide a helpful, concise response that:
      1. Directly answers the user's question
      2. Provides relevant market insights when applicable
      3. Suggests actionable steps when appropriate
      4. Maintains a professional, helpful tone
      
      Keep your response focused and practical.
    `;

    const systemPrompt = 'You are an expert trading assistant with deep knowledge of financial markets, trading strategies, and portfolio management. Provide helpful, accurate responses to trading questions.';
    
    return await this.callAI(prompt, {
      systemPrompt,
      model: options.model || DEFAULT_MODEL,
      temperature: 0.7,
      maxTokens: 1000
    });
  }

  // AI Stock Picker - Comprehensive stock analysis and recommendations
  async generateStockPicks(marketData, userPreferences = {}, options = {}) {
    // Determine analysis focus based on trading timeframe
    const timeframe = userPreferences.timeframe || 'short-term';
    let analysisWeights = {};
    let timeframeDescription = '';
    
    switch (timeframe) {
      case 'day-trading':
        analysisWeights = { technical: 80, sentiment: 15, fundamental: 5 };
        timeframeDescription = 'Day Trading (intraday positions, focus on technical patterns, volume, volatility)';
        break;
      case 'short-term':
        analysisWeights = { technical: 60, sentiment: 25, fundamental: 15 };
        timeframeDescription = 'Short Term Trading (2-3 days, focus on momentum and technical signals)';
        break;
      case '2-3-weeks':
        analysisWeights = { technical: 45, sentiment: 20, fundamental: 35 };
        timeframeDescription = '2-3 Week Trading (swing trading, balanced technical and fundamental analysis)';
        break;
      case '1-month':
        analysisWeights = { technical: 30, sentiment: 15, fundamental: 55 };
        timeframeDescription = '1 Month Trading (position trading, emphasis on fundamentals and catalysts)';
        break;
      case 'short':
        analysisWeights = { technical: 25, sentiment: 15, fundamental: 60 };
        timeframeDescription = 'Short Term Investment (1-6 months, fundamental analysis with technical timing)';
        break;
      case 'medium':
        analysisWeights = { technical: 20, sentiment: 10, fundamental: 70 };
        timeframeDescription = 'Medium Term Investment (6-18 months, fundamental-driven with growth focus)';
        break;
      case 'long':
        analysisWeights = { technical: 15, sentiment: 5, fundamental: 80 };
        timeframeDescription = 'Long Term Investment (18+ months, deep fundamental analysis and value investing)';
        break;
      default:
        analysisWeights = { technical: 50, sentiment: 20, fundamental: 30 };
        timeframeDescription = 'Balanced approach';
    }

    const prompt = `
      You are an expert stock analyst and active trader. Analyze the provided market data and generate intelligent stock picks optimized for ${timeframeDescription}.
      
      Market Data: ${JSON.stringify(marketData)}
      User Preferences: ${JSON.stringify(userPreferences)}
      Trading Timeframe: ${timeframeDescription}
      Analysis Weights: Technical ${analysisWeights.technical}%, Sentiment ${analysisWeights.sentiment}%, Fundamental ${analysisWeights.fundamental}%
      
      Please analyze stocks with emphasis on the specified timeframe and provide recommendations:
      
      **For ${timeframe} analysis, focus on:**
      ${timeframe === 'day-trading' ? `
      - Intraday volatility and volume patterns
      - Pre-market and after-hours activity
      - Technical indicators: RSI, MACD, Bollinger Bands
      - Support/resistance levels for entry/exit
      - Market maker activity and order flow
      - News catalysts for intraday moves
      ` : timeframe === 'short-term' ? `
      - 2-3 day momentum patterns
      - Technical breakouts and breakdowns
      - Short-term sentiment shifts
      - Earnings announcements within timeframe
      - Technical indicators: Moving averages, momentum oscillators
      - Volume confirmation of price moves
      ` : timeframe === '2-3-weeks' ? `
      - Swing trading setups and patterns
      - Earnings season impacts
      - Sector rotation opportunities
      - Technical and fundamental convergence
      - Medium-term trend analysis
      - Event-driven catalysts
      ` : timeframe === '1-month' ? `
      - Position trading opportunities
      - Fundamental catalysts and earnings
      - Monthly trend analysis
      - Quarterly performance expectations
      - Fundamental valuation metrics
      - Long-term technical patterns
      ` : timeframe === 'short' ? `
      - Quarterly earnings and guidance
      - Business cycle positioning
      - Fundamental valuation metrics
      - Industry trends and competitive positioning
      - Management quality and execution
      - Balance sheet strength and cash flow
      ` : timeframe === 'medium' ? `
      - Annual growth prospects and market expansion
      - Competitive moats and sustainable advantages
      - Industry disruption and innovation cycles
      - Management strategic vision and execution
      - Financial health and capital allocation
      - Dividend growth and shareholder returns
      ` : timeframe === 'long' ? `
      - Long-term secular trends and demographics
      - Sustainable competitive advantages and market leadership
      - Innovation capabilities and R&D investments
      - ESG factors and regulatory environment
      - Capital allocation discipline and shareholder value creation
      - Dividend aristocrats and compound growth potential
      ` : `
      - Balanced technical and fundamental analysis
      - Market trends and sector rotation
      - Risk-adjusted returns and diversification
      - Growth and value opportunities
      `}
      
      1. **Technical Analysis** (Weight: ${analysisWeights.technical}%): Chart patterns, momentum indicators, support/resistance levels
      2. **Fundamental Analysis** (Weight: ${analysisWeights.fundamental}%): P/E ratios, revenue growth, debt levels, market cap
      3. **Sentiment Analysis** (Weight: ${analysisWeights.sentiment}%): News sentiment, social media buzz, analyst ratings
      4. **Sector Analysis**: Industry trends, sector rotation opportunities
      5. **Risk Assessment**: Volatility, beta, correlation with market
      6. **Growth Potential**: Revenue projections, market expansion opportunities
      7. **Dividend Analysis**: Yield, payout ratio, dividend growth history (if applicable)
      8. **Competitive Position**: Market share, competitive advantages, moats
      
      Consider user preferences for:
      - Risk tolerance (conservative/moderate/aggressive)
      - Trading timeframe: ${timeframeDescription}
      - Sector preferences or restrictions
      - Market cap preferences (large/mid/small cap)
      - Dividend requirements
      - ESG considerations
      
      Format your response as JSON with the following structure:
      {
        "recommendations": [
          {
            "symbol": "stock symbol",
            "companyName": "company name",
            "currentPrice": "current stock price",
            "targetPrice": "12-month target price",
            "recommendation": "BUY/HOLD/SELL",
            "confidence": "confidence level 0-100",
            "timeframe": "recommended holding period",
            "sector": "industry sector",
            "marketCap": "market capitalization category",
            "analysis": {
              "technical": {
                "score": "technical score 0-100",
                "signals": ["technical signal 1", "technical signal 2"],
                "chartPattern": "current chart pattern",
                "momentum": "momentum analysis"
              },
              "fundamental": {
                "score": "fundamental score 0-100",
                "peRatio": "P/E ratio",
                "revenueGrowth": "revenue growth rate",
                "profitMargin": "profit margin",
                "debtToEquity": "debt to equity ratio",
                "roe": "return on equity"
              },
              "sentiment": {
                "score": "sentiment score 0-100",
                "newsScore": "news sentiment 0-100",
                "socialScore": "social media sentiment 0-100",
                "analystRating": "average analyst rating",
                "institutionalFlow": "institutional money flow"
              },
              "risk": {
                "score": "risk score 0-100",
                "volatility": "volatility measure",
                "beta": "beta coefficient",
                "maxDrawdown": "historical max drawdown",
                "correlationSPY": "correlation with S&P 500"
              }
            },
            "catalysts": ["potential catalyst 1", "potential catalyst 2"],
            "risks": ["risk factor 1", "risk factor 2"],
            "reasoning": "detailed reasoning for recommendation",
            "dividendYield": "dividend yield if applicable",
            "esgScore": "ESG score if available"
          }
        ],
        "portfolioAllocation": {
          "conservative": "allocation for conservative investors",
          "moderate": "allocation for moderate investors",
          "aggressive": "allocation for aggressive investors"
        },
        "sectorBreakdown": {
          "technology": "percentage allocation",
          "healthcare": "percentage allocation",
          "finance": "percentage allocation",
          "energy": "percentage allocation",
          "consumer": "percentage allocation",
          "industrials": "percentage allocation",
          "utilities": "percentage allocation",
          "materials": "percentage allocation"
        },
        "marketOutlook": {
          "shortTerm": "1-3 day outlook",
          "mediumTerm": "1-2 week outlook",
          "longTerm": "3-4 week outlook"
        },
        "riskFactors": ["market risk 1", "market risk 2"],
        "opportunities": ["market opportunity 1", "market opportunity 2"],
        "summary": "executive summary of recommendations"
      }
    `;

    const systemPrompt = 'You are an expert stock analyst with deep knowledge of financial markets, technical analysis, fundamental analysis, and portfolio management. Provide comprehensive, data-driven stock recommendations with detailed analysis and reasoning.';
    
    return await this.callAI(prompt, {
      systemPrompt,
      model: options.model || DEFAULT_MODEL,
      temperature: 0.4,
      maxTokens: 4000
    });
  }
}

module.exports = new AIService();
