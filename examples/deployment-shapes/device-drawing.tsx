import type { InfrastructureKind } from './deviceGeometry';

/** These are intrinsic SVG device shapes, independent of the host's flat/isometric layout. */
export function DeviceDrawing({ kind, unstyled = false }: { kind: InfrastructureKind; unstyled?: boolean }) {
  const face = unstyled ? 'none' : 'var(--fp-bg-secondary, #fff)';
  const side = unstyled ? 'none' : 'color-mix(in srgb, currentColor 14%, var(--fp-bg-secondary, #fff))';
  return <svg data-device-shape={kind} viewBox="0 0 176 76" width="100%" height="100%"
    role="img" aria-label={`${kind} shape`} style={{ overflow: 'visible', pointerEvents: 'none' }}>
    <g fill={face} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      {kind === 'server' ? <g data-device-detail="server-rack">
        <path d="M46 8 60 1H138L124 8Z" fill={side} />
        <path d="M124 8 138 1V65L124 74Z" fill={side} />
        <rect x="46" y="8" width="78" height="66" rx="3" />
        {[18, 36, 54].map(y => <g key={y}><rect x="53" y={y} width="64" height="13" rx="2" />
          <circle cx="60" cy={y + 6.5} r="1.5" fill="currentColor" />
          <path d={`M70 ${y + 5}h37M70 ${y + 9}h28`} /></g>)}
      </g> : kind === 'router' ? <g data-device-detail="router-disk">
        <path d="M19 26V48C19 65 157 65 157 48V26" fill={side} />
        <ellipse cx="88" cy="26" rx="69" ry="22" />
        <path d="M50 26h28m-7-6 7 6-7 6M126 26H98m7-6-7 6 7 6M88 10v10m-5-5 5 5 5-5M88 43V32m-5 5 5-5 5 5" />
      </g> : kind === 'switch' ? <g data-device-detail="switch-ports">
        <path d="M12 24 27 10H163L148 24Z" fill={side} />
        <path d="M148 24 163 10V47L148 61Z" fill={side} />
        <rect x="12" y="24" width="136" height="37" rx="3" />
        {Array.from({ length: 8 }, (_, index) => <rect key={index} x={23 + index * 14} y="34" width="9" height="13" rx="1" />)}
        <path d="M23 53h101" />
      </g> : <g data-device-detail="fallback-card">
        <rect x="9" y="6" width="158" height="64" rx="7" />
        <path d="M25 23h126M25 38h90M25 53h108" opacity="0.5" />
      </g>}
    </g>
  </svg>;
}
