// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapPaperTradingSimPage() {
  return (
    <GapFeaturePage
      title="Paper Trading Simulator"
      description="Paper Trading Simulator"
      slug="paper-trading-sim"
      aiResultKey="order"
      fields={[
  {
    "name": "symbol",
    "label": "Symbol",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "quantity",
    "label": "Quantity",
    "type": "number"
  }
]}
    />
  )
}
