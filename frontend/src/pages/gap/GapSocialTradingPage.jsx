// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapSocialTradingPage() {
  return (
    <GapFeaturePage
      title="Social/Copy Trading"
      description="Social/Copy Trading"
      slug="social-trading"
      aiResultKey="follow"
      fields={[
  {
    "name": "userId",
    "label": "User ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "traderId",
    "label": "Trader ID",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
