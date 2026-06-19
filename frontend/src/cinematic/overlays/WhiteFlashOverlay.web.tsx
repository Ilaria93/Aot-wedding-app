type WhiteFlashOverlayProps = {
  opacity: number;
};

/**
 * Full-bleed white flash used at the end of the cinematic hero scroll (web only).
 */
export function WhiteFlashOverlay({ opacity }: WhiteFlashOverlayProps) {
  if (opacity <= 0) {
    return null;
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 4,
        pointerEvents: 'none',
        backgroundColor: '#ffffff',
        opacity,
      }}
    />
  );
}
