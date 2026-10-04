/** The rig controller ring: a circle with a notch at 12 o'clock and a centre dot. */
export function Ring({ size = 20, className, strokeWidth = 2 }: { size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13.5" r="7.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12 6V1.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="13.5" r="2.25" fill="currentColor" />
    </svg>
  );
}
