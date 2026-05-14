const { parseAIJson } = require('../src/utils/parseAIJson');

describe('parseAIJson — 3-strategy resilient parser', () => {
  test('strategy 1: direct parse of valid JSON', () => {
    const out = parseAIJson('{"a":1,"b":[2,3]}');
    expect(out).toEqual({ a: 1, b: [2, 3] });
  });

  test('strategy 2: extracts JSON from ```json fenced block', () => {
    const text = 'Here you go:\n```json\n{"sentiment":"bullish","confidence":0.8}\n```\nThanks!';
    const out = parseAIJson(text);
    expect(out).toEqual({ sentiment: 'bullish', confidence: 0.8 });
  });

  test('strategy 2: extracts JSON from generic ``` block', () => {
    const text = 'Reply:\n```\n[1,2,3]\n```';
    const out = parseAIJson(text);
    expect(out).toEqual([1, 2, 3]);
  });

  test('strategy 3: extracts first balanced { } block from prose', () => {
    const text = 'I think the answer is { "ok": true, "tags": ["x","y"] } as expected.';
    const out = parseAIJson(text);
    expect(out).toEqual({ ok: true, tags: ['x', 'y'] });
  });

  test('returns fallback when no JSON found', () => {
    const out = parseAIJson('No structured data here.', { fallback: { fail: true } });
    expect(out).toEqual({ fail: true });
  });

  test('handles null/undefined gracefully', () => {
    expect(parseAIJson(null)).toBeNull();
    expect(parseAIJson(undefined, { fallback: 'x' })).toBe('x');
  });

  test('handles strings with embedded quotes inside JSON', () => {
    const text = '```json\n{"msg":"He said \\"hi\\""}\n```';
    const out = parseAIJson(text);
    expect(out).toEqual({ msg: 'He said "hi"' });
  });
});
