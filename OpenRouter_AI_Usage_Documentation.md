# OpenRouter AI Usage Documentation

## Overview
This document provides a comprehensive overview of all places where OpenRouter AI is being called in the AI Trading Platform and documents all the prompts being used.

## OpenRouter Configuration

### API Configuration
- **Base URL**: `https://openrouter.ai/api/v1`
- **API Key**: Stored in environment variable `OPENROUTER_API_KEY`
- **Default Model**: `anthropic/claude-sonnet-4`
- **Headers**:
  - Authorization: `Bearer ${OPENROUTER_API_KEY}`
  - HTTP-Referer: `${APP_URL}` (defaults to http://localhost:3000)
  - X-Title: 'AI Trading Platform'
  - Content-Type: 'application/json'

### Environment Variables
```
OPENROUTER_API_KEY=
```

## AI Service Implementation

### File: `backend/src/utils/aiService.js`

This is the main AI service class that handles all OpenRouter API calls.

#### Generic AI Call Method
```javascript
async callAI(prompt, options = {})
```
- **Purpose**: Generic method to call OpenRouter API
- **Default System Prompt**: "You are an expert financial AI assistant."
- **Default Parameters**:
  - Model: `anthropic/claude-sonnet-4`
  - Temperature: 0.7
  - Max Tokens: 1000

## AI Service Methods and Prompts

### 1. Market Analysis Generation

#### Method: `generateMarketAnalysis(marketData, options = {})`

**System Prompt:**
```
You are an expert financial market analyst. Provide detailed, actionable market analysis based on the provided data.
```

**User Prompt:**
```
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
```

**Parameters:**
- Model: `anthropic/claude-sonnet-4`
- Temperature: 0.5
- Max Tokens: 2000

### 2. Trading Strategy Generation

#### Method: `generateTradingStrategy(portfolioData, marketData, options = {})`

**System Prompt:**
```
You are an expert quantitative trading strategist. Create detailed, profitable trading strategies based on the provided data.
```

**User Prompt:**
```
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
```

**Parameters:**
- Model: `anthropic/claude-sonnet-4`
- Temperature: 0.6
- Max Tokens: 2500

### 3. Market Predictions Generation

#### Method: `generateMarketPredictions(marketData, timeframe, options = {})`

**System Prompt:**
```
You are an expert market predictor and quantitative analyst. Provide accurate, data-driven market predictions in the exact JSON format specified.
```

**User Prompt:**
```
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
```

**Parameters:**
- Model: `anthropic/claude-sonnet-4`
- Temperature: 0.4
- Max Tokens: 2500

### 4. Portfolio Analysis

#### Method: `analyzePortfolio(portfolioData, marketData, options = {})`

**System Prompt:**
```
You are an expert portfolio manager and financial advisor. Provide comprehensive portfolio analysis and actionable recommendations.
```

**User Prompt:**
```
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
```

**Parameters:**
- Model: `anthropic/claude-sonnet-4`
- Temperature: 0.5
- Max Tokens: 2000

### 5. Risk Assessment

#### Method: `assessRisk(portfolioData, marketData, options = {})`

**System Prompt:**
```
You are an expert risk analyst. Provide detailed risk assessments and mitigation strategies.
```

**User Prompt:**
```
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
```

**Parameters:**
- Model: `anthropic/claude-sonnet-4`
- Temperature: 0.3
- Max Tokens: 1500

### 6. Trading Assistant Response

#### Method: `getTradingAssistantResponse(conversationHistory, context, options = {})`

**System Prompt:**
```
You are an expert trading assistant with deep knowledge of financial markets, trading strategies, and portfolio management. Provide helpful, accurate responses to trading questions.
```

**User Prompt:**
```
You are a conversational trading assistant. The user has asked a question about trading.

Conversation History: ${JSON.stringify(conversationHistory)}
Context: ${JSON.stringify(context)}

Please provide a helpful, concise response that:
1. Directly answers the user's question
2. Provides relevant market insights when applicable
3. Suggests actionable steps when appropriate
4. Maintains a professional, helpful tone

Keep your response focused and practical.
```

**Parameters:**
- Model: `anthropic/claude-sonnet-4`
- Temperature: 0.7
- Max Tokens: 1000

## Controller Usage

### 1. Strategy Controller (`backend/src/controllers/strategyController.js`)

#### AI Usage Location:
- **Method**: `optimizeStrategy`
- **AI Service Call**: `aiService.generateTradingStrategy(strategy, marketData.data)`
- **Purpose**: Optimize existing trading strategies using AI

### 2. Market Analysis Controller (`backend/src/controllers/marketAnalysisController.js`)

#### AI Usage Locations:

1. **Method**: `getTradingAssistantResponse`
   - **AI Service Call**: `aiService.getTradingAssistantResponse(conversationHistory || [], { userMessage: message, ...context })`
   - **Purpose**: Generate responses for the trading assistant chat

2. **Method**: `generateMarketAnalysis`
   - **AI Service Call**: `aiService.generateMarketAnalysis(marketData.data)`
   - **Purpose**: Generate comprehensive market analysis using AI

### 3. Prediction Controller (`backend/src/controllers/predictionController.js`)

#### AI Usage Location:
- **Note**: Currently, the prediction controller does not directly use the AI service. It generates predictions using predefined algorithms and sample data.

### 4. Portfolio Controller (`backend/src/controllers/portfolioController.js`)

#### AI Usage Location:
- **Note**: Currently, the portfolio controller does not directly use the AI service. Portfolio analysis is handled through the AI service methods but not directly called from this controller.

## API Endpoints That Trigger AI Calls

### Strategy Endpoints
- `PUT /api/strategies/:id/optimize` - Calls `aiService.generateTradingStrategy()`

### Market Analysis Endpoints
- `POST /api/market-analysis/assistant` - Calls `aiService.getTradingAssistantResponse()`
- `POST /api/market-analysis/generate` - Calls `aiService.generateMarketAnalysis()`

## Error Handling

All AI service calls include error handling:
```javascript
try {
  const response = await axios.post(`${this.baseUrl}/chat/completions`, requestBody, { headers: this.headers });
  return response.data.choices[0].message.content;
} catch (error) {
  console.error('Error calling OpenRouter API:', error.response?.data || error.message);
  throw new Error(`AI service error: ${error.response?.data?.error?.message || error.message}`);
}
```

## Usage Statistics

Based on the codebase analysis:
- **Total AI Service Methods**: 6
- **Active Controller Integrations**: 2 (Strategy, Market Analysis)
- **API Endpoints with AI**: 3
- **Default Model Used**: `anthropic/claude-sonnet-4`
- **Total Unique Prompts**: 6 main prompts + 1 generic system prompt

## Security Considerations

1. **API Key Storage**: Stored in environment variables
2. **Request Headers**: Include proper referer and title identification
3. **Error Handling**: Sensitive information is not exposed in error messages
4. **Input Validation**: All inputs are JSON stringified before sending to AI

## Future Enhancements

Potential areas for AI integration expansion:
1. Portfolio optimization in Portfolio Controller
2. Real-time prediction updates in Prediction Controller
3. Risk assessment integration across all financial operations
4. Automated trading signal generation
5. Sentiment analysis from news and social media feeds
