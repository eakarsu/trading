// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapResearchSummarizerPage() {
  return (
    <GapFeaturePage
      title="Research Summarizer (filings/earnings)"
      description="Research Summarizer (filings/earnings)"
      slug="research-summarizer"
      aiResultKey="summary"
      fields={[
  {
    "name": "ticker",
    "label": "Ticker",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "text",
    "label": "Filing/Earnings Text",
    "type": "textarea",
    "rows": 4,
    "required": true
  }
]}
    />
  )
}
