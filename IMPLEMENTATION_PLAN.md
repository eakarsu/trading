# TradingAI Platform - Complete Redesign Plan

## Overview
Transform the current demo trading app into a **professional real-trading platform** with Alpaca broker integration, advanced AI features, and real-time market data.

---

## Phase 1: Core Infrastructure (Week 1)

### 1.1 Alpaca API Integration

#### Backend Setup
```
/backend/src/services/alpacaService.js
```

**Features:**
- Authentication with Alpaca API keys
- Account info & buying power
- Real-time position tracking
- Order execution (market, limit, stop, stop-limit)
- Order history & status
- Real-time price streaming via WebSocket

**API Endpoints to Create:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alpaca/account` | GET | Get account info, buying power, equity |
| `/api/alpaca/positions` | GET | Get all current positions |
| `/api/alpaca/orders` | GET | Get order history |
| `/api/alpaca/orders` | POST | Place new order |
| `/api/alpaca/orders/:id` | DELETE | Cancel order |
| `/api/alpaca/quote/:symbol` | GET | Get real-time quote |
| `/api/alpaca/bars/:symbol` | GET | Get historical bars/candles |

**Environment Variables:**
```env
ALPACA_API_KEY=your_api_key
ALPACA_SECRET_KEY=your_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets  # Paper trading
# ALPACA_BASE_URL=https://api.alpaca.markets      # Live trading
```

### 1.2 Real-Time Data Infrastructure

#### WebSocket Service
```
/backend/src/services/websocketService.js
```

**Features:**
- Real-time price updates
- Order status updates
- Account balance changes
- Push notifications for alerts

#### Frontend WebSocket Hook
```
/frontend/src/hooks/useAlpacaStream.js
```

---

## Phase 2: New Page Structure (Week 2-3)

### 2.1 Command Center (Dashboard Replacement)

**Location:** `/frontend/src/pages/CommandCenterPage.js`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  COMMAND CENTER                            [Paper] [Live] [⚙️]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ BUYING POWER    │  │ PORTFOLIO VALUE │  │ TODAY'S P&L     │ │
│  │ $125,432.50     │  │ $847,291.00     │  │ +$2,847 (+0.34%)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │ POSITIONS (Live)             │  │ AI ALERTS                ││
│  │ ┌──────┬───────┬───────────┐ │  │ ⚠️ AAPL down 3% - News   ││
│  │ │ AAPL │ 150sh │ +$234.50  │ │  │ 💡 Consider: NVDA dip    ││
│  │ │ GOOGL│  25sh │ -$89.20   │ │  │ 📊 Earnings: TSLA tmrw   ││
│  │ │ TSLA │  50sh │ +$1,203   │ │  │ 🎯 Target hit: MSFT      ││
│  │ └──────┴───────┴───────────┘ │  └──────────────────────────┘│
│  └──────────────────────────────┘                               │
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │ PENDING ORDERS               │  │ MARKET PULSE             ││
│  │ BUY 100 NVDA @ $450 (Limit) │  │ S&P 500: 4,892 (+0.5%)   ││
│  │ SELL 50 AMD @ $180 (Stop)   │  │ NASDAQ:  15,234 (+0.8%)  ││
│  └──────────────────────────────┘  │ VIX:     14.2 (-2.1%)    ││
│                                    └──────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ QUICK TRADE                    Symbol: [____] [BUY] [SELL] ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- `AccountSummaryCards` - Buying power, portfolio value, P&L
- `LivePositionsTable` - Real-time position updates
- `AIAlertsPanel` - Proactive AI notifications
- `PendingOrdersPanel` - Open orders with cancel option
- `MarketPulseWidget` - Major indices real-time
- `QuickTradeBar` - Fast order entry

---

### 2.2 Trade Page (New)

**Location:** `/frontend/src/pages/TradePage.js`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  TRADE                                    [AAPL ▼] Apple Inc.   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │                    TRADINGVIEW CHART                        ││
│  │                    (Real-time candles)                      ││
│  │                                                             ││
│  │  [1m] [5m] [15m] [1h] [1D] [1W]    [Indicators ▼]          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────┐  ┌──────────────────────────────────┐
│  │ ORDER ENTRY            │  │ STOCK INFO                       │
│  │                        │  │                                  │
│  │ [◉ BUY] [○ SELL]      │  │ Price: $178.42  Change: +$2.31  │
│  │                        │  │ Open:  $176.20  High:   $179.80 │
│  │ Order Type: [Market ▼] │  │ Low:   $175.90  Volume: 52.3M   │
│  │ Quantity:   [100     ] │  │                                  │
│  │ Limit:      [$178.50 ] │  │ ┌─────────────────────────────┐ │
│  │                        │  │ │ AI INSIGHT                  │ │
│  │ Est. Cost: $17,850     │  │ │ "AAPL showing bullish       │ │
│  │                        │  │ │  momentum. RSI at 58,       │ │
│  │ [  PLACE ORDER  ]      │  │ │  above 50-day MA."          │ │
│  │                        │  │ └─────────────────────────────┘ │
│  └────────────────────────┘  └──────────────────────────────────┘
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ RECENT ORDERS FOR AAPL                                      ││
│  │ ┌──────────┬────────┬───────┬──────────┬─────────┐         ││
│  │ │ Time     │ Side   │ Qty   │ Price    │ Status  │         ││
│  │ │ 10:32 AM │ BUY    │ 50    │ $177.20  │ Filled  │         ││
│  │ │ 09:45 AM │ SELL   │ 25    │ $176.80  │ Filled  │         ││
│  │ └──────────┴────────┴───────┴──────────┴─────────┘         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- `SymbolSearch` - Autocomplete stock search
- `TradingViewChart` - Embedded TradingView widget or custom chart
- `OrderEntryForm` - Buy/Sell with order types
- `StockInfoPanel` - Real-time quote data
- `AIInsightCard` - AI analysis for current stock
- `RecentOrdersTable` - Order history for symbol

**Order Types Supported:**
- Market Order
- Limit Order
- Stop Order
- Stop-Limit Order
- Trailing Stop

---

### 2.3 Research Page (Replaces Market Analysis + Predictions + Stock Picks)

**Location:** `/frontend/src/pages/ResearchPage.js`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  RESEARCH                    [Screener] [Watchlist] [Compare]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ AI STOCK SCREENER                                           ││
│  │                                                             ││
│  │ Strategy: [Growth Stocks ▼]  Sector: [Technology ▼]        ││
│  │ Market Cap: [Large ▼]        Risk: [Moderate ▼]            ││
│  │                                                             ││
│  │ [🔍 FIND STOCKS]                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ RESULTS                                          [Export]   ││
│  │ ┌────────┬──────────┬────────┬────────┬─────────┬────────┐ ││
│  │ │ Symbol │ Company  │ Price  │ Change │ AI Score│ Action │ ││
│  │ ├────────┼──────────┼────────┼────────┼─────────┼────────┤ ││
│  │ │ NVDA   │ NVIDIA   │ $875   │ +2.3%  │ 92/100  │ [View] │ ││
│  │ │ AMD    │ AMD Inc  │ $178   │ +1.8%  │ 87/100  │ [View] │ ││
│  │ │ AVGO   │ Broadcom │ $1,234 │ +0.9%  │ 85/100  │ [View] │ ││
│  │ └────────┴──────────┴────────┴────────┴─────────┴────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │ STOCK DETAIL: NVDA           │  │ AI ANALYSIS              ││
│  │                              │  │                          ││
│  │ [Mini Chart]                 │  │ Technical:  ████████░ 85 ││
│  │                              │  │ Fundamental:████████░ 88 ││
│  │ P/E: 65.2  |  EPS: $12.96   │  │ Sentiment:  ███████░░ 78 ││
│  │ 52W High: $974 | Low: $403  │  │                          ││
│  │ Avg Volume: 42.3M           │  │ Recommendation: BUY      ││
│  │                              │  │ Target: $950 (+8.5%)     ││
│  │ [Add to Watchlist] [Trade]  │  │                          ││
│  └──────────────────────────────┘  └──────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- `StockScreener` - Filter stocks by criteria
- `AIScoreCard` - Combined technical/fundamental/sentiment score
- `StockDetailPanel` - Detailed stock information
- `MiniChart` - Small price chart
- `WatchlistManager` - Save and organize watchlists
- `CompareStocks` - Side-by-side comparison tool

---

### 2.4 Portfolio Page (Enhanced)

**Location:** `/frontend/src/pages/PortfolioPage.js` (Redesigned)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  PORTFOLIO                              [1D] [1W] [1M] [YTD]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  PORTFOLIO VALUE: $847,291.00               ││
│  │                  Today: +$2,847.32 (+0.34%)                 ││
│  │                                                             ││
│  │  [═══════════════════ Performance Chart ═══════════════════]││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │ HOLDINGS                     │  │ ALLOCATION               ││
│  │ ┌──────┬─────┬───────┬─────┐│  │                          ││
│  │ │Symbol│Shares│ Value │ P&L ││  │  [PIE CHART]             ││
│  │ ├──────┼─────┼───────┼─────┤│  │                          ││
│  │ │ AAPL │ 150 │$26.7K │+12% ││  │  Tech:    45%            ││
│  │ │ GOOGL│  25 │$34.2K │+8%  ││  │  Finance: 20%            ││
│  │ │ TSLA │  50 │$12.5K │-3%  ││  │  Health:  15%            ││
│  │ │ MSFT │  80 │$30.1K │+15% ││  │  Energy:  10%            ││
│  │ └──────┴─────┴───────┴─────┘│  │  Other:   10%            ││
│  └──────────────────────────────┘  └──────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ORDER HISTORY                                    [Export]   ││
│  │ ┌──────────┬────────┬──────┬───────┬──────────┬──────────┐ ││
│  │ │ Date     │ Symbol │ Side │ Qty   │ Price    │ Total    │ ││
│  │ │ Dec 8    │ AAPL   │ BUY  │ 50    │ $177.20  │ $8,860   │ ││
│  │ │ Dec 7    │ NVDA   │ SELL │ 10    │ $875.00  │ $8,750   │ ││
│  │ └──────────┴────────┴──────┴───────┴──────────┴──────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** Real Alpaca positions & order history

---

### 2.5 AI Advisor Page (Replaces Trading Assistant)

**Location:** `/frontend/src/pages/AIAdvisorPage.js`

**Features:**
- **Proactive Alerts** - AI monitors your portfolio and market
- **Trade Ideas** - AI suggests trades based on your holdings
- **Risk Warnings** - Alerts before concentrated positions
- **Natural Language Trading** - "Buy 10 AAPL" → executes order
- **Portfolio Review** - Weekly AI summary of performance
- **Earnings Alerts** - AI warns before earnings announcements

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  AI ADVISOR                                     [Settings ⚙️]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │ ALERTS (3 new)               │  │ TODAY'S TRADE IDEAS      ││
│  │                              │  │                          ││
│  │ 🔴 TSLA earnings tomorrow    │  │ 💡 BUY NVDA              ││
│  │    Consider reducing pos.    │  │    AI Score: 92          ││
│  │                              │  │    "Strong momentum..."  ││
│  │ 🟡 Portfolio 60% in tech     │  │    [Quick Trade]         ││
│  │    Diversification warning   │  │                          ││
│  │                              │  │ 💡 SELL AMD              ││
│  │ 🟢 AAPL hit target $180      │  │    "Take profits at..."  ││
│  │    Consider taking profits   │  │    [Quick Trade]         ││
│  └──────────────────────────────┘  └──────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ CHAT WITH AI ADVISOR                                        ││
│  │                                                             ││
│  │  You: What do you think about buying more NVDA?            ││
│  │                                                             ││
│  │  AI: Based on your current portfolio, adding NVDA would    ││
│  │      increase your tech exposure to 52%. However, NVDA     ││
│  │      has strong momentum with an AI score of 92/100.       ││
│  │      Consider a smaller position of 5-10 shares.           ││
│  │                                                             ││
│  │  You: Buy 5 shares of NVDA                                 ││
│  │                                                             ││
│  │  AI: I'll place a market order for 5 shares of NVDA.       ││
│  │      Estimated cost: $4,375. [Confirm] [Cancel]            ││
│  │                                                             ││
│  │  [Type message or command...]                    [Send]    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Backend Enhancements (Week 3-4)

### 3.1 New API Routes

```
/backend/src/routes/
├── alpacaRoutes.js      # Broker integration
├── aiRoutes.js          # AI analysis endpoints
├── alertRoutes.js       # User alerts & notifications
├── watchlistRoutes.js   # Watchlist management
└── screenerRoutes.js    # Stock screening
```

### 3.2 Enhanced AI Service

```javascript
// /backend/src/services/aiService.js - New Methods

class AIService {
  // Proactive monitoring
  async analyzePortfolioRisk(positions) {}
  async generateDailyInsights(userId) {}
  async detectEarningsAlerts(positions) {}

  // Trade assistance
  async generateTradeIdeas(portfolio, marketData) {}
  async analyzeTradeDecision(symbol, action, quantity) {}
  async parseNaturalLanguageOrder(text) {}

  // Research
  async screenStocks(criteria) {}
  async compareStocks(symbols) {}
  async generateStockReport(symbol) {}
}
```

### 3.3 Database Updates

**New Tables/Collections:**
- `alerts` - User notifications and AI alerts
- `watchlists` - Saved stock watchlists
- `trade_ideas` - AI-generated trade suggestions
- `user_preferences` - Trading preferences, risk tolerance

---

## Phase 4: Real-Time Features (Week 4-5)

### 4.1 WebSocket Events

| Event | Direction | Data |
|-------|-----------|------|
| `price_update` | Server → Client | Real-time price changes |
| `order_update` | Server → Client | Order status changes |
| `position_update` | Server → Client | Position changes |
| `alert` | Server → Client | AI alerts and notifications |
| `subscribe` | Client → Server | Subscribe to symbols |

### 4.2 Push Notifications

- Browser notifications for important alerts
- Email notifications for order fills
- Mobile push (future: React Native app)

---

## Phase 5: Advanced Features (Week 5-6)

### 5.1 TradingView Integration
- Embedded advanced charts
- Custom indicators
- Drawing tools
- Multiple timeframes

### 5.2 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `B` | Open buy order |
| `S` | Open sell order |
| `Esc` | Cancel/Close |
| `/` | Search symbol |
| `P` | Go to portfolio |
| `T` | Go to trade |

### 5.3 Paper/Live Mode Toggle
- Easy switch between paper and live trading
- Visual indicators (green = paper, red = live)
- Confirmation for live trades

---

## Technical Stack

### Frontend
- React 18 with hooks
- TradingView Charting Library
- Socket.io-client for WebSocket
- Recharts for custom charts
- React Query for data fetching

### Backend
- Node.js + Express
- Alpaca Trade API
- Socket.io for real-time
- PostgreSQL for data
- Redis for caching (optional)

### External APIs
- **Alpaca** - Trading & market data
- **OpenRouter/Claude** - AI analysis
- **Finnhub** (optional) - Additional market data
- **News API** (optional) - Financial news

---

## Implementation Order

1. **Week 1:** Alpaca integration backend + basic frontend connection
2. **Week 2:** Command Center page with real positions
3. **Week 3:** Trade page with order execution
4. **Week 4:** Research page with AI screening
5. **Week 5:** Portfolio page with real data + AI Advisor
6. **Week 6:** Polish, testing, WebSocket stability

---

## File Structure (New)

```
frontend/src/
├── pages/
│   ├── CommandCenterPage.js    # NEW - Main dashboard
│   ├── TradePage.js            # NEW - Trading interface
│   ├── ResearchPage.js         # NEW - Stock research
│   ├── PortfolioPage.js        # REDESIGNED
│   └── AIAdvisorPage.js        # NEW - AI assistant
├── components/
│   ├── trading/
│   │   ├── OrderEntryForm.js
│   │   ├── PositionsTable.js
│   │   ├── OrdersTable.js
│   │   └── QuickTradeBar.js
│   ├── charts/
│   │   ├── TradingViewChart.js
│   │   ├── PerformanceChart.js
│   │   └── AllocationChart.js
│   ├── ai/
│   │   ├── AIAlertsPanel.js
│   │   ├── AIInsightCard.js
│   │   ├── TradeIdeasPanel.js
│   │   └── ChatInterface.js
│   └── market/
│       ├── MarketPulse.js
│       ├── StockCard.js
│       └── ScreenerResults.js
├── hooks/
│   ├── useAlpaca.js            # Alpaca API hook
│   ├── useAlpacaStream.js      # WebSocket hook
│   └── useAI.js                # AI service hook
└── services/
    ├── alpacaApi.js            # Alpaca REST calls
    └── websocket.js            # WebSocket connection

backend/src/
├── routes/
│   ├── alpacaRoutes.js         # NEW
│   ├── aiRoutes.js             # ENHANCED
│   └── alertRoutes.js          # NEW
├── services/
│   ├── alpacaService.js        # NEW
│   ├── aiService.js            # ENHANCED
│   └── websocketService.js     # NEW
└── controllers/
    ├── alpacaController.js     # NEW
    └── aiController.js         # ENHANCED
```

---

## Getting Started

### 1. Get Alpaca API Keys
1. Sign up at https://alpaca.markets
2. Go to Paper Trading → API Keys
3. Generate new API key pair
4. Add to `.env` file

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install @alpaca/alpaca-trade-api socket.io

# Frontend
cd frontend
npm install socket.io-client lightweight-charts
```

### 3. Start Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## Success Metrics

- [ ] Real-time positions display correctly
- [ ] Orders execute successfully on Alpaca
- [ ] WebSocket updates arrive < 1 second
- [ ] AI provides relevant, actionable insights
- [ ] Paper/Live mode toggle works correctly
- [ ] All pages load < 2 seconds
- [ ] Mobile responsive design works

---

*This plan transforms the demo app into a production-ready trading platform. Each phase builds on the previous one, allowing for incremental testing and deployment.*
