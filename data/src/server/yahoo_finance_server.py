import yfinance as yf
import pandas as pd
import json
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Cache for market data to avoid frequent API calls
market_data_cache = {}
cache_timestamps = {}
CACHE_DURATION = 3600  # 1 hour in seconds

def get_multi_asset_data():
    """Fetch data from all major asset classes"""
    
    # Market Indices
    indices = {
        'S&P 500': '^GSPC',
        'NASDAQ': '^IXIC', 
        'Dow Jones': '^DJI',
        'FTSE 100': '^FTSE',
        'Nikkei': '^N225'
    }
    
    # Individual Stocks
    stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']
    
    # Commodities (using Yahoo symbols)
    commodities = {
        'Gold': 'GC=F',
        'Silver': 'SI=F', 
        'Crude Oil': 'CL=F',
        'Natural Gas': 'NG=F',
        'Copper': 'HG=F'
    }
    
    # Currencies (Forex pairs)
    currencies = {
        'EUR/USD': 'EURUSD=X',
        'GBP/USD': 'GBPUSD=X',
        'USD/JPY': 'USDJPY=X',
        'USD/CHF': 'USDCHF=X'
    }
    
    all_symbols = []
    all_symbols.extend(list(indices.values()))
    all_symbols.extend(stocks)
    all_symbols.extend(list(commodities.values()))
    all_symbols.extend(list(currencies.values()))
    
    try:
        # Fetch data for all assets
        data = yf.download(all_symbols, period="1mo", interval="1d")
        return data, indices, stocks, commodities, currencies
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None, indices, stocks, commodities, currencies

def process_market_data():
    """Process and organize market data into categories"""
    data, indices, stocks, commodities, currencies = get_multi_asset_data()
    
    if data is None:
        return None
    
    processed_data = {
        'indices': [],
        'stocks': [],
        'commodities': [],
        'currencies': []
    }
    
    # Process indices
    for name, symbol in indices.items():
        if ('Close', symbol) in data.columns:
            latest_close = data[('Close', symbol)].dropna().iloc[-1] if not data[('Close', symbol)].dropna().empty else None
            if latest_close is not None:
                # Calculate change and change percentage (simplified)
                prev_close = data[('Close', symbol)].dropna().iloc[-2] if len(data[('Close', symbol)].dropna()) > 1 else latest_close
                change = latest_close - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0
                
                processed_data['indices'].append({
                    'symbol': symbol,
                    'name': name,
                    'price': float(latest_close),
                    'change': float(change),
                    'changePercent': float(change_percent),
                    'volume': 'N/A',  # Volume data would require separate API call
                    'high': float(data[('High', symbol)].dropna().iloc[-1]) if not data[('High', symbol)].dropna().empty else float(latest_close),
                    'low': float(data[('Low', symbol)].dropna().iloc[-1]) if not data[('Low', symbol)].dropna().empty else float(latest_close)
                })
    
    # Process stocks
    for symbol in stocks:
        if ('Close', symbol) in data.columns:
            latest_close = data[('Close', symbol)].dropna().iloc[-1] if not data[('Close', symbol)].dropna().empty else None
            if latest_close is not None:
                # Calculate change and change percentage (simplified)
                prev_close = data[('Close', symbol)].dropna().iloc[-2] if len(data[('Close', symbol)].dropna()) > 1 else latest_close
                change = latest_close - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0
                
                processed_data['stocks'].append({
                    'symbol': symbol,
                    'name': symbol,  # In a real implementation, you'd map symbols to company names
                    'price': float(latest_close),
                    'change': float(change),
                    'changePercent': float(change_percent),
                    'volume': 'N/A',  # Volume data would require separate API call
                    'marketCap': 'N/A',  # Market cap data would require separate API call
                    'high': float(data[('High', symbol)].dropna().iloc[-1]) if not data[('High', symbol)].dropna().empty else float(latest_close),
                    'low': float(data[('Low', symbol)].dropna().iloc[-1]) if not data[('Low', symbol)].dropna().empty else float(latest_close)
                })
    
    # Process commodities
    for name, symbol in commodities.items():
        if ('Close', symbol) in data.columns:
            latest_close = data[('Close', symbol)].dropna().iloc[-1] if not data[('Close', symbol)].dropna().empty else None
            if latest_close is not None:
                # Calculate change and change percentage (simplified)
                prev_close = data[('Close', symbol)].dropna().iloc[-2] if len(data[('Close', symbol)].dropna()) > 1 else latest_close
                change = latest_close - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0
                
                processed_data['commodities'].append({
                    'symbol': name,
                    'name': name,
                    'price': float(latest_close),
                    'change': float(change),
                    'changePercent': float(change_percent),
                    'volume': 'N/A',
                    'high': float(data[('High', symbol)].dropna().iloc[-1]) if not data[('High', symbol)].dropna().empty else float(latest_close),
                    'low': float(data[('Low', symbol)].dropna().iloc[-1]) if not data[('Low', symbol)].dropna().empty else float(latest_close)
                })
    
    # Process currencies
    for name, symbol in currencies.items():
        if ('Close', symbol) in data.columns:
            latest_close = data[('Close', symbol)].dropna().iloc[-1] if not data[('Close', symbol)].dropna().empty else None
            if latest_close is not None:
                # Calculate change and change percentage (simplified)
                prev_close = data[('Close', symbol)].dropna().iloc[-2] if len(data[('Close', symbol)].dropna()) > 1 else latest_close
                change = latest_close - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0
                
                processed_data['currencies'].append({
                    'symbol': name,
                    'name': name,
                    'price': float(latest_close),
                    'change': float(change),
                    'changePercent': float(change_percent),
                    'volume': 'N/A',
                    'high': float(data[('High', symbol)].dropna().iloc[-1]) if not data[('High', symbol)].dropna().empty else float(latest_close),
                    'low': float(data[('Low', symbol)].dropna().iloc[-1]) if not data[('Low', symbol)].dropna().empty else float(latest_close)
                })
    
    return processed_data

def update_cache():
    """Update the market data cache"""
    global market_data_cache, cache_timestamps
    while True:
        try:
            print("Updating market data cache...")
            data = process_market_data()
            if data is not None:
                market_data_cache = data
                cache_timestamps['last_update'] = datetime.now().isoformat()
                print("Market data cache updated successfully")
            else:
                print("Failed to update market data cache")
        except Exception as e:
            print(f"Error updating cache: {e}")
        
        # Wait for the cache duration before updating again
        time.sleep(CACHE_DURATION)

@app.route('/api/market-data/real-time', methods=['GET'])
def get_real_time_data():
    """Get real-time market data"""
    # Check if cache is valid
    if market_data_cache and 'last_update' in cache_timestamps:
        last_update = datetime.fromisoformat(cache_timestamps['last_update'])
        if datetime.now() - last_update < timedelta(seconds=CACHE_DURATION):
            return jsonify({
                'message': 'Real-time market data',
                'data': market_data_cache,
                'timestamp': cache_timestamps['last_update']
            })
    
    # If cache is not valid or doesn't exist, return current data
    data = process_market_data()
    if data is not None:
        return jsonify({
            'message': 'Real-time market data',
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
    else:
        return jsonify({
            'message': 'Error fetching real-time market data',
            'data': None
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Start the cache update thread
    cache_thread = threading.Thread(target=update_cache, daemon=True)
    cache_thread.start()
    
    # Run the Flask app
    app.run(host='localhost', port=5002, debug=True)
