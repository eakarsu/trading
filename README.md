# AI Trading Platform

## Project Vision
Build a cutting-edge, professional trading website that showcases the full spectrum of generative AI capabilities for financial markets. The platform serves as both a functional trading tool and a demonstration of AI's transformative power in finance, targeting serious traders, institutions, and AI enthusiasts.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm (v6 or higher)
- Alpha Vantage API Key (Free tier available at https://www.alphavantage.co/support/#api-key)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/eakarsu/trading.git
   cd trading
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start MongoDB:
   - On macOS with Homebrew: `brew services start mongodb-community`
   - On macOS with MongoDB installed via MongoDB website: `mongod --config /usr/local/etc/mongod.conf`
   - On Linux: `sudo systemctl start mongod`

4. Start the application:
   ```bash
   npm start
   ```

## API Keys Setup
To use real market data, you need to obtain an Alpha Vantage API key:

1. Visit https://www.alphavantage.co/support/#api-key to get a free API key
2. Add your API key to the backend/.env file:
   ```
   ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
   ```

## Architecture
- `/frontend` - User interface components (React.js)
- `/backend` - Server-side logic and APIs (Node.js with Express)
- `/ai-models` - AI/ML models and training scripts
- `/data` - Data processing and storage solutions
- `/docs` - Documentation and guidelines
- `/config` - Configuration files

## Ports
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Features
1. **Intelligent Market Analysis Suite**
2. **AI Strategy Generator and Optimizer**
3. **Conversational Trading Assistant**
4. **Advanced Content Generation**
5. **Predictive Analytics and Forecasting**

## Development
- Backend: `npm run backend`
- Frontend: `npm run frontend`
- Both: `npm start` or `npm run dev`
