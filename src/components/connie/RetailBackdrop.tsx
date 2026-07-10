/** The dimmed retailer (Amazon) page shown behind Connie on every browse screen.
 *  One shared component so the image, opacity, position, and size are identical everywhere. */
export const RETAIL_BG = '/figma/insights-bg.png'

export function RetailBackdrop() {
  return (
    <img
      src={RETAIL_BG}
      alt=""
      className="pointer-events-none absolute object-cover"
      style={{ left: -110, top: 0, width: 1720, height: 1074, opacity: 0.4 }}
    />
  )
}
