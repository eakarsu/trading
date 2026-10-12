import React, { useEffect, useState } from 'react';
import NativeAIControls from './NativeAIControls';
import NativeAIReport from './NativeAIReport';
import useNativeAIRequest from './useNativeAIRequest';
import './NativeRuntimeAI.css';

export function presetFields(config, current, index) {
  const manual = [];
  const values = Object.fromEntries(config.fields.map(field => {
    const sample = field.examples?.[index];
    if (field.reference || field.file || sample === undefined || sample === null || sample === '') {
      if (!current[field.key]) manual.push(field.label);
      return [field.key, current[field.key] || ''];
    }
    return [field.key, sample];
  }));
  return { values, manual };
}

export function SavedReports({ history, historyError, selected, onSelect, title }) {
  return <section className="native-ai-history">
    <h2>Saved reports</h2>
    {historyError && <p role="alert">{historyError}</p>}
    {!historyError && !history.length && <p>No saved reports yet.</p>}
    <ul>{history.map(row => <li key={row.id}>
      <button type="button" onClick={() => onSelect(row)}>
        {new Date(row.createdAt).toLocaleString()} · {row.model}
      </button>
    </li>)}</ul>
    {selected && <NativeAIReport
      response={{ content: selected.content, model: selected.model }}
      title={`${title} · ${new Date(selected.createdAt).toLocaleString()}`}
    />}
  </section>;
}

export default function NativeRuntimeAI({ config, request, loadHistory }) {
  const [fields, setFields] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [selected, setSelected] = useState(null);
  const native = useNativeAIRequest();
  const presets = [0, 1, 2].map(index => ({
    name: ['Quick brief', 'Team planning', 'Detailed review'][index],
    fill: () => {
      const next = presetFields(config, fields, index);
      setFields(next.values);
      return { filled: config.fields.length - next.manual.length, manual: next.manual };
    },
  }));

  async function refreshHistory() {
    if (!loadHistory) return;
    try {
      setHistory(await loadHistory());
      setHistoryError('');
    } catch (failure) {
      setHistoryError(failure.response?.data?.message || failure.message || 'Saved reports could not be loaded.');
    }
  }

  useEffect(() => { refreshHistory(); }, [loadHistory]);

  async function generate(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    try {
      const body = Object.fromEntries(config.fields.map(field => [field.key, fields[field.key] || '']));
      const response = await native.run(signal => request(config.endpoint, body, { signal }));
      setResult(response);
      await refreshHistory();
    } catch (failure) {
      setError(failure.name === 'AbortError' ? 'Request canceled.' : failure.response?.data?.error || failure.message);
    }
  }

  return <section className="native-runtime-ai" id="ai-readiness">
    <header><p className="ai-eyebrow">Native AI workspace</p><h1>{config.title}</h1><p>{config.description}</p></header>
    <NativeAIControls busy={native.busy} onCancel={native.cancel} presets={presets} context={config.title}>
      <form onSubmit={generate}>
        <div className="native-runtime-fields">{config.fields.map(field =>
          <label key={field.key} htmlFor={'native-runtime-' + field.key}>
            {field.label}{field.required ? ' *' : ' (optional)'}
            <textarea id={'native-runtime-' + field.key} data-ai-field={field.key} rows={5}
              required={field.required} maxLength={field.maxLength || 4000}
              value={fields[field.key] || ''} onChange={event => setFields({ ...fields, [field.key]: event.target.value })} />
          </label>
        )}</div>
        <button type="submit" className="native-runtime-generate" disabled={native.busy}>
          {native.busy ? 'Generating…' : 'Generate with OpenRouter'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </NativeAIControls>
    {result !== null && <NativeAIReport response={result} title={config.title} />}
    <SavedReports history={history} historyError={historyError} selected={selected}
      onSelect={setSelected} title="Saved report" />
  </section>;
}
