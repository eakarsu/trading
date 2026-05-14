import React, { useState } from 'react';
import {
  aiSentimentAnalyzer,
  aiRiskCalculator,
  aiCorrelationAnalyzer,
  aiAlertOptimizer,
  aiTaxLossHarvest,
  aiOptionsGreeks,
  aiCopyTradingSuggest,
  paperTradingAccount,
  paperTradingOrder,
  paperTradingReset,
} from '../api/aiResults';

const TABS = [
  { id: 'sentiment', label: 'Sentiment Analyzer', emoji: '💬' },
  { id: 'risk', label: 'Risk Calculator', emoji: '⚠️' },
  { id: 'correlation', label: 'Correlation Analyzer', emoji: '🔗' },
  { id: 'alert', label: 'Alert Optimizer', emoji: '🔔' },
  { id: 'tax', label: 'Tax-Loss Harvest', emoji: '🧾' },
  { id: 'options', label: 'Options Greeks', emoji: '🧮' },
  { id: 'paper', label: 'Paper Trading', emoji: '📝' },
  { id: 'copy', label: 'Copy Trading', emoji: '👥' },
];

const styles = {
  page: { padding: 24, color: '#e2e8f0', fontFamily: 'Inter, sans-serif' },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 800, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8' },
  tabBar: { display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #1e293b', paddingBottom: 8 },
  tab: (active) => ({
    padding: '8px 16px',
    border: 'none',
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#cbd5e1',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  }),
  card: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: 20,
  },
  label: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#cbd5e1' },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 13,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 13,
    minHeight: 100,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  button: (loading) => ({
    background: loading ? '#475569' : '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 700,
    cursor: loading ? 'wait' : 'pointer',
    fontSize: 13,
  }),
  result: {
    marginTop: 16,
    background: '#0c4a6e22',
    border: '1px solid #0284c7',
    borderRadius: 12,
    padding: 16,
  },
  errorBox: {
    marginTop: 16,
    background: '#7f1d1d33',
    border: '1px solid #ef4444',
    borderRadius: 12,
    padding: 12,
    color: '#fecaca',
    fontSize: 13,
  },
  pre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: 'ui-monospace, monospace',
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};

function ResultBox({ result, error }) {
  if (error) return <div style={styles.errorBox}>{error}</div>;
  if (!result) return null;
  return (
    <div style={styles.result}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Result</div>
      <pre style={styles.pre}>
        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

function SentimentForm() {
  const [symbol, setSymbol] = useState('');
  const [headlines, setHeadlines] = useState('');
  const [socialPosts, setSocialPosts] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      const payload = {
        symbol,
        headlines: headlines.split('\n').map((s) => s.trim()).filter(Boolean),
        socialPosts: socialPosts.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      const data = await aiSentimentAnalyzer(payload);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Symbol</label>
        <input style={styles.input} value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g., AAPL" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>News Headlines (one per line)</label>
        <textarea style={styles.textarea} value={headlines} onChange={(e) => setHeadlines(e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Social Posts (one per line)</label>
        <textarea style={styles.textarea} value={socialPosts} onChange={(e) => setSocialPosts(e.target.value)} />
      </div>
      <button type="submit" style={styles.button(loading)} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Sentiment'}
      </button>
      <ResultBox result={result} error={error} />
    </form>
  );
}

function RiskCalculatorForm() {
  const [portfolio, setPortfolio] = useState(JSON.stringify([
    { symbol: 'AAPL', weight: 0.4 },
    { symbol: 'MSFT', weight: 0.3 },
    { symbol: 'TLT', weight: 0.3 },
  ], null, 2));
  const [horizon, setHorizon] = useState('1 month');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [scenarios, setScenarios] = useState('rate hike +50bps\nequity drawdown 10%');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      let p;
      try { p = JSON.parse(portfolio); }
      catch { setError('Portfolio must be valid JSON array'); setLoading(false); return; }
      const payload = {
        portfolio: p,
        horizon,
        confidenceLevel: Number(confidenceLevel),
        scenarios: scenarios.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      const data = await aiRiskCalculator(payload);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Portfolio (JSON array)</label>
        <textarea style={{ ...styles.textarea, minHeight: 130, fontFamily: 'ui-monospace, monospace' }} value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={styles.label}>Horizon</label>
          <input style={styles.input} value={horizon} onChange={(e) => setHorizon(e.target.value)} placeholder="e.g., 1 month, 1 year" />
        </div>
        <div>
          <label style={styles.label}>Confidence Level</label>
          <input type="number" step="0.01" min="0.5" max="0.999" style={styles.input} value={confidenceLevel} onChange={(e) => setConfidenceLevel(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Stress Scenarios (one per line)</label>
        <textarea style={styles.textarea} value={scenarios} onChange={(e) => setScenarios(e.target.value)} />
      </div>
      <button type="submit" style={styles.button(loading)} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Risk'}
      </button>
      <ResultBox result={result} error={error} />
    </form>
  );
}

function CorrelationForm() {
  const [symbols, setSymbols] = useState('AAPL, MSFT, NVDA, TLT, GLD');
  const [period, setPeriod] = useState('90d');
  const [returnType, setReturnType] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      const payload = {
        symbols: symbols.split(',').map((s) => s.trim()).filter(Boolean),
        period,
        returnType,
      };
      const data = await aiCorrelationAnalyzer(payload);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Symbols (comma separated)</label>
        <input style={styles.input} value={symbols} onChange={(e) => setSymbols(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={styles.label}>Period</label>
          <input style={styles.input} value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g., 30d, 90d, 1y" />
        </div>
        <div>
          <label style={styles.label}>Return Type</label>
          <select style={styles.input} value={returnType} onChange={(e) => setReturnType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <button type="submit" style={styles.button(loading)} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Correlations'}
      </button>
      <ResultBox result={result} error={error} />
    </form>
  );
}

function AlertOptimizerForm() {
  const [alerts, setAlerts] = useState(JSON.stringify([
    { id: 1, symbol: 'AAPL', type: 'price-cross', threshold: 200, active: true },
    { id: 2, symbol: 'NVDA', type: 'rsi', threshold: 70, active: true },
  ], null, 2));
  const [recentTriggers, setRecentTriggers] = useState('');
  const [falsePositives, setFalsePositives] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      let parsed;
      try { parsed = JSON.parse(alerts); }
      catch { setError('Alerts must be valid JSON array'); setLoading(false); return; }
      const payload = {
        alerts: parsed,
        recentTriggers: recentTriggers.split('\n').map(s => s.trim()).filter(Boolean),
        falsePositiveExamples: falsePositives.split('\n').map(s => s.trim()).filter(Boolean),
      };
      const data = await aiAlertOptimizer(payload);
      setResult(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503) setError('AI service is not configured (missing OPENROUTER_API_KEY).');
      else setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Alerts (JSON array)</label>
        <textarea style={{ ...styles.textarea, minHeight: 130, fontFamily: 'ui-monospace, monospace' }} value={alerts} onChange={(e) => setAlerts(e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Recent triggers (one per line)</label>
        <textarea style={styles.textarea} value={recentTriggers} onChange={(e) => setRecentTriggers(e.target.value)} placeholder="e.g. AAPL price-cross 200 fired 2025-04-30" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Flagged false-positives (one per line)</label>
        <textarea style={styles.textarea} value={falsePositives} onChange={(e) => setFalsePositives(e.target.value)} />
      </div>
      <button type="submit" style={styles.button(loading)} disabled={loading}>
        {loading ? 'Optimizing...' : 'Optimize Alerts'}
      </button>
      <ResultBox result={result} error={error} />
    </form>
  );
}

function TaxLossHarvestForm() {
  const [positions, setPositions] = useState(JSON.stringify([
    { symbol: 'AAPL', quantity: 100, costBasis: 175.0, marketPrice: 165.0, holdingPeriod: 'long' },
    { symbol: 'TSLA', quantity: 50, costBasis: 240.0, marketPrice: 195.0, holdingPeriod: 'short' },
  ], null, 2));
  const [ytdRealizedGains, setYtdRealizedGains] = useState(0);
  const [jurisdiction, setJurisdiction] = useState('US');
  const [washSaleSensitivity, setWashSaleSensitivity] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      let p;
      try { p = JSON.parse(positions); }
      catch { setError('Positions must be valid JSON array'); setLoading(false); return; }
      const payload = {
        positions: p,
        ytdRealizedGains: Number(ytdRealizedGains) || 0,
        jurisdiction,
        washSaleSensitivity,
      };
      const data = await aiTaxLossHarvest(payload);
      setResult(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503) setError('AI service is not configured (missing OPENROUTER_API_KEY).');
      else setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Positions (JSON array)</label>
        <textarea style={{ ...styles.textarea, minHeight: 140, fontFamily: 'ui-monospace, monospace' }} value={positions} onChange={(e) => setPositions(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={styles.label}>YTD Realized Gains ($)</label>
          <input type="number" style={styles.input} value={ytdRealizedGains} onChange={(e) => setYtdRealizedGains(e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Jurisdiction</label>
          <input style={styles.input} value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Wash-sale sensitivity</label>
          <select style={styles.input} value={washSaleSensitivity} onChange={(e) => setWashSaleSensitivity(e.target.value)}>
            <option value="strict">Strict</option>
            <option value="standard">Standard</option>
            <option value="lenient">Lenient</option>
          </select>
        </div>
      </div>
      <button type="submit" style={styles.button(loading)} disabled={loading}>
        {loading ? 'Analyzing...' : 'Find Harvest Candidates'}
      </button>
      <ResultBox result={result} error={error} />
    </form>
  );
}

function OptionsGreeksForm() {
  const [spot, setSpot] = useState(100);
  const [strike, setStrike] = useState(100);
  const [tte, setTte] = useState(0.25);
  const [vol, setVol] = useState(0.3);
  const [rate, setRate] = useState(0.04);
  const [type, setType] = useState('call');
  const [aiCommentary, setAiCommentary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      const data = await aiOptionsGreeks({
        spot: Number(spot), strike: Number(strike), time_to_expiry_years: Number(tte),
        volatility: Number(vol), risk_free_rate: Number(rate), option_type: type,
        ai_commentary: aiCommentary,
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={styles.label}>Spot</label><input type="number" step="any" style={styles.input} value={spot} onChange={(e) => setSpot(e.target.value)} /></div>
        <div><label style={styles.label}>Strike</label><input type="number" step="any" style={styles.input} value={strike} onChange={(e) => setStrike(e.target.value)} /></div>
        <div><label style={styles.label}>Time to Expiry (yrs)</label><input type="number" step="any" style={styles.input} value={tte} onChange={(e) => setTte(e.target.value)} /></div>
        <div><label style={styles.label}>Volatility (e.g. 0.3)</label><input type="number" step="any" style={styles.input} value={vol} onChange={(e) => setVol(e.target.value)} /></div>
        <div><label style={styles.label}>Risk-Free Rate</label><input type="number" step="any" style={styles.input} value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div>
          <label style={styles.label}>Type</label>
          <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ ...styles.label, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiCommentary} onChange={(e) => setAiCommentary(e.target.checked)} />
          Include AI commentary
        </label>
      </div>
      <button type="submit" style={styles.button(loading)} disabled={loading}>
        {loading ? 'Computing...' : 'Compute Greeks'}
      </button>
      <ResultBox result={result} error={error} />
    </form>
  );
}

function PaperTradingForm() {
  const [account, setAccount] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [side, setSide] = useState('buy');
  const [qty, setQty] = useState(10);
  const [px, setPx] = useState(180);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try { const d = await paperTradingAccount(); setAccount(d.account); }
    catch (err) { setError(err?.response?.data?.message || err.message); }
  };
  React.useEffect(() => { refresh(); }, []);

  const order = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const d = await paperTradingOrder({ symbol, side, quantity: Number(qty), price: Number(px) });
      setAccount(d.account);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  const reset = async () => {
    setLoading(true); setError(null);
    try { const d = await paperTradingReset(); setAccount(d.account); }
    catch (err) { setError(err?.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 14, color: '#cbd5e1' }}>
        <strong>Cash:</strong> ${account ? account.cash.toFixed(2) : '...'} ·{' '}
        <strong>Positions:</strong>{' '}
        {account && Object.keys(account.positions || {}).length
          ? Object.entries(account.positions).map(([s, p]) => `${s}: ${p.qty}@${p.avg_cost.toFixed(2)}`).join(', ')
          : 'none'}
      </div>
      <form onSubmit={order}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label style={styles.label}>Symbol</label><input style={styles.input} value={symbol} onChange={(e) => setSymbol(e.target.value)} /></div>
          <div>
            <label style={styles.label}>Side</label>
            <select style={styles.input} value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div><label style={styles.label}>Qty</label><input type="number" style={styles.input} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div><label style={styles.label}>Price</label><input type="number" step="any" style={styles.input} value={px} onChange={(e) => setPx(e.target.value)} /></div>
        </div>
        <button type="submit" style={styles.button(loading)} disabled={loading}>{loading ? 'Working...' : 'Place Paper Order'}</button>
        <button type="button" style={{ ...styles.button(false), background: '#64748b', marginLeft: 8 }} onClick={reset}>Reset Account</button>
      </form>
      {error && <div style={styles.errorBox}>{error}</div>}
      <div style={{ marginTop: 14 }}>
        <div style={styles.label}>Recent fills</div>
        <pre style={styles.pre}>{account ? JSON.stringify(account.history.slice(0, 10), null, 2) : '...'}</pre>
      </div>
    </div>
  );
}

function CopyTradingForm() {
  const [profile, setProfile] = useState(JSON.stringify({ style: 'momentum', avg_holding_days: 5, sectors: ['tech', 'consumer'], typical_position_size_pct: 5 }, null, 2));
  const [positions, setPositions] = useState(JSON.stringify([{ symbol: 'AAPL', qty: 10 }], null, 2));
  const [constraints, setConstraints] = useState(JSON.stringify({ max_position_pct: 5, no_leverage: true }, null, 2));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      const payload = {
        target_trader_profile: JSON.parse(profile),
        my_positions: JSON.parse(positions),
        my_constraints: JSON.parse(constraints),
      };
      const data = await aiCopyTradingSuggest(payload);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Target Trader Profile (JSON)</label>
        <textarea style={{ ...styles.textarea, minHeight: 100, fontFamily: 'ui-monospace, monospace' }} value={profile} onChange={(e) => setProfile(e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>My Positions (JSON)</label>
        <textarea style={{ ...styles.textarea, minHeight: 80, fontFamily: 'ui-monospace, monospace' }} value={positions} onChange={(e) => setPositions(e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>My Constraints (JSON)</label>
        <textarea style={{ ...styles.textarea, minHeight: 80, fontFamily: 'ui-monospace, monospace' }} value={constraints} onChange={(e) => setConstraints(e.target.value)} />
      </div>
      <button type="submit" style={styles.button(loading)} disabled={loading}>{loading ? 'Analyzing...' : 'Suggest Copy-Trading Plan'}</button>
      <ResultBox result={result} error={error} />
    </form>
  );
}

export default function AIRiskToolsPage() {
  const [activeTab, setActiveTab] = useState('sentiment');

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>AI Risk &amp; Sentiment Tools</div>
        <div style={styles.subtitle}>
          Sentiment analysis, portfolio risk calculation, and correlation analysis powered by AI.
        </div>
      </div>

      <div style={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            style={styles.tab(activeTab === t.id)}
            onClick={() => setActiveTab(t.id)}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === 'sentiment' && <SentimentForm />}
        {activeTab === 'risk' && <RiskCalculatorForm />}
        {activeTab === 'correlation' && <CorrelationForm />}
        {activeTab === 'alert' && <AlertOptimizerForm />}
        {activeTab === 'tax' && <TaxLossHarvestForm />}
        {activeTab === 'options' && <OptionsGreeksForm />}
        {activeTab === 'paper' && <PaperTradingForm />}
        {activeTab === 'copy' && <CopyTradingForm />}
        <div style={styles.disclaimer}>
          Disclaimer: AI output is for research purposes only and is not investment advice.
        </div>
      </div>
    </div>
  );
}
