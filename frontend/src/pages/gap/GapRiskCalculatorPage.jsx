// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapRiskCalculatorPage() {
  return (
    <GapFeaturePage
      title="Risk Calculator (VaR/Stress)"
      description="Risk Calculator (VaR/Stress)"
      slug="risk-calculator"
      aiResultKey="risk"
      fields={[
  {
    "name": "portfolio",
    "label": "Portfolio (JSON)",
    "type": "json"
  },
  {
    "name": "horizon",
    "label": "Horizon",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
