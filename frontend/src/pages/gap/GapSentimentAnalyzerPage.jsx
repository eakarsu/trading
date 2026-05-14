// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapSentimentAnalyzerPage() {
  return (
    <GapFeaturePage
      title="Sentiment Analyzer"
      description="Sentiment Analyzer"
      slug="sentiment-analyzer"
      aiResultKey="sentiment"
      fields={[
  {
    "name": "ticker",
    "label": "Ticker",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "sources",
    "label": "Sources",
    "type": "array"
  }
]}
    />
  )
}
