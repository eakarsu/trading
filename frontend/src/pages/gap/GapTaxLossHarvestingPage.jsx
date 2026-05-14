// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapTaxLossHarvestingPage() {
  return (
    <GapFeaturePage
      title="Tax-Loss Harvesting"
      description="Tax-Loss Harvesting"
      slug="tax-loss-harvesting"
      aiResultKey="suggestions"
      fields={[
  {
    "name": "userId",
    "label": "User ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "taxYear",
    "label": "Tax Year",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
