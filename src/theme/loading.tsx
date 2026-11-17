import { forwardRef } from 'react';
import { useFootprintComponents, type FootprintLoadStatusAdapterProps, type FootprintPrimitiveOptions } from './components';
import { componentStyles, theme } from './styles';
export interface FootprintLoadStatusProps extends FootprintLoadStatusAdapterProps, FootprintPrimitiveOptions {}
/** Presentation only: placeholders never become graph nodes or recorded evidence. */
export const FootprintLoadStatus = forwardRef<HTMLDivElement, FootprintLoadStatusProps>(function FootprintLoadStatus(input, ref) {
  const { state, indicator = 'skeleton', label, children, unstyled, defaultStyle, style, part, densitySize = 'default', ...props } = input;
  const Custom = useFootprintComponents().LoadStatus;
  const shared = { ...props, role: state === 'error' ? 'alert' : 'status', 'aria-busy': state !== 'error', 'data-fp-part': part } as const;
  if (Custom) return <Custom {...shared} ref={ref} state={state} indicator={indicator} label={label} style={style}>{children}</Custom>;
  const ui = componentStyles(densitySize);
  return <div {...shared} ref={ref} data-fp="load-status" data-state={state} data-indicator={indicator}
    style={unstyled ? style : { padding: ui.padding, fontFamily: theme.fontSans, fontSize: ui.body, color: theme.textPrimary,
      background: theme.bgSecondary, border: `${ui.borderWidth} solid ${theme.border}`, borderRadius: ui.radiusPanel, ...defaultStyle, ...style }}>
    {state !== 'error' && indicator === 'skeleton' && <div aria-hidden="true" data-fp="loading-skeleton" style={unstyled ? undefined : { display: 'grid', gap: ui.spaceXs, marginBottom: ui.spaceSm }}>
      {[80, 55].map(width => <div key={width} style={unstyled ? undefined : { width: `${width}%`, height: ui.spaceSm, borderRadius: ui.radiusBadge, background: theme.border }} />)}
    </div>}
    {state !== 'error' && indicator === 'spinner' && <span aria-hidden="true" data-fp="loading-spinner" style={unstyled ? undefined : { display: 'inline-block', marginRight: ui.spaceSm, width: ui.iconSize, height: ui.iconSize, border: `${ui.borderWidth} solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: '50%', animation: `fp-load-spin calc(${ui.duration} * 4) linear infinite` }} />}
    <span>{label}</span>{children}
    {!unstyled && indicator === 'spinner' && <style>{'@keyframes fp-load-spin { to { transform: rotate(360deg) } } @media (prefers-reduced-motion: reduce) { [data-fp="loading-spinner"] { animation: none !important } }'}</style>}
  </div>;
});
