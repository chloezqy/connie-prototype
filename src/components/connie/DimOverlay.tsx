/**
 * The 10% scrim drawn under any Connie pop-up window (Product Insights card, the annotation
 * modal, the share dialog…). It separates the panel from a full-colour page without washing the
 * page out — the page itself stays at full saturation.
 *
 * Render it immediately before the panel so it sits between the page and the panel.
 */
export function DimOverlay({ onClick }: { onClick?: () => void }) {
  return (
    <div
      aria-hidden
      onClick={onClick}
      className="absolute inset-0"
      style={{ background: 'rgba(5,5,0,0.1)' }}
    />
  )
}
