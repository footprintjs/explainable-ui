import {
  createContext,
  forwardRef,
  useContext,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type RefAttributes,
} from "react";
import type { Size } from "../types";
import { componentStyles, theme } from "./styles";

/**
 * Adapters must forward the native ref, events, disabled/checked state, ARIA
 * and data attributes. The registry changes presentation, not Lens actions.
 */
export interface FootprintComponents {
  LoadStatus?: ElementType<FootprintLoadStatusAdapterProps & RefAttributes<HTMLDivElement>>;
  Button?: ElementType<ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>>;
  Tab?: ElementType<ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>>;
  Input?: ElementType<InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>>;
  Checkbox?: ElementType<InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>>;
  Badge?: ElementType<HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>>;
  Code?: ElementType<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>>;
  Tooltip?: ElementType<FootprintTooltipAdapterProps & RefAttributes<HTMLSpanElement>>;
  Icon?: ElementType<FootprintIconAdapterProps & RefAttributes<HTMLSpanElement>>;
}

export interface FootprintLoadStatusAdapterProps extends HTMLAttributes<HTMLDivElement> {
  state: 'loading' | 'preparing' | 'error';
  indicator?: 'skeleton' | 'spinner' | 'text';
  label: string;
}

export const FootprintComponentsContext = createContext<FootprintComponents>({});
export function useFootprintComponents(): FootprintComponents { return useContext(FootprintComponentsContext); }

export interface FootprintPrimitiveOptions {
  /** Omit the library's paint; explicit consumer style is still honored. */
  unstyled?: boolean;
  /** Library fallback paint. A registered host component never receives it.
   *  Explicit undefined opts out; omitting this prop uses the default recipe. */
  defaultStyle?: CSSProperties;
  /** Stable semantic part name available to a host adapter as data-fp-part. */
  part?: string;
  densitySize?: Size;
}
export interface FootprintButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, FootprintPrimitiveOptions {}
export interface FootprintInputProps extends InputHTMLAttributes<HTMLInputElement>, FootprintPrimitiveOptions {}
export interface FootprintCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type">, FootprintPrimitiveOptions {}
export interface FootprintBadgeProps extends HTMLAttributes<HTMLSpanElement>, FootprintPrimitiveOptions {}
export interface FootprintCodeProps extends HTMLAttributes<HTMLElement>, FootprintPrimitiveOptions {}
export interface FootprintTooltipAdapterProps extends HTMLAttributes<HTMLSpanElement> { content?: string }
export interface FootprintTooltipProps extends FootprintTooltipAdapterProps, FootprintPrimitiveOptions {}
export interface FootprintIconAdapterProps extends HTMLAttributes<HTMLSpanElement> { name: string; children?: ReactNode }
export interface FootprintIconProps extends FootprintIconAdapterProps, FootprintPrimitiveOptions {}

function partProps(part: string | undefined): { "data-fp-part"?: string } {
  return part === undefined ? {} : { "data-fp-part": part };
}

function paint(unstyled: boolean | undefined, fallback: CSSProperties | undefined, style: CSSProperties | undefined): CSSProperties | undefined {
  if (unstyled || !fallback) return style;
  return { ...fallback, ...style };
}
function fallback(options: FootprintPrimitiveOptions, recipe: () => CSSProperties): CSSProperties | undefined {
  return Object.prototype.hasOwnProperty.call(options, "defaultStyle") ? options.defaultStyle : recipe();
}
function control(size: Size): CSSProperties {
  const ui = componentStyles(size);
  return { fontFamily: theme.fontSans, fontSize: ui.body, lineHeight: ui.lineHeight,
    minHeight: ui.controlHeight, padding: ui.controlPadding, borderRadius: ui.radiusControl,
    border: `${ui.borderWidth} solid ${theme.border}`, background: theme.bgPrimary, color: theme.textPrimary };
}

export const FootprintButton = forwardRef<HTMLButtonElement, FootprintButtonProps>(function FootprintButton(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize = "default", type = "button", ...props
  } = input;
  const Custom = useFootprintComponents().Button;
  if (Custom) return <Custom {...props} type={type} ref={ref} style={style} {...partProps(part)} />;
  return <button {...props} type={type} ref={ref} style={paint(unstyled, fallback(input, () => control(densitySize)), style)} {...partProps(part)} />;
});

export const FootprintTab = forwardRef<HTMLButtonElement, FootprintButtonProps>(function FootprintTab(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize = "default", type = "button", ...props
  } = input;
  const components = useFootprintComponents();
  const Custom = components.Tab ?? components.Button;
  if (Custom) return <Custom {...props} type={type} ref={ref} style={style} {...partProps(part)} />;
  return <button {...props} type={type} ref={ref} style={paint(unstyled, fallback(input, () => control(densitySize)), style)} {...partProps(part)} />;
});

export const FootprintInput = forwardRef<HTMLInputElement, FootprintInputProps>(function FootprintInput(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize = "default", ...props
  } = input;
  const Custom = useFootprintComponents().Input;
  if (Custom) return <Custom {...props} ref={ref} style={style} {...partProps(part)} />;
  return <input {...props} ref={ref} style={paint(unstyled, fallback(input, () => control(densitySize)), style)} {...partProps(part)} />;
});

export const FootprintCheckbox = forwardRef<HTMLInputElement, FootprintCheckboxProps>(function FootprintCheckbox(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize = "default", ...props
  } = input;
  const components = useFootprintComponents();
  const Custom = components.Checkbox ?? components.Input;
  if (Custom) return <Custom {...props} type="checkbox" ref={ref} style={style} {...partProps(part)} />;
  const ui = componentStyles(densitySize);
  return <input {...props} type="checkbox" ref={ref} style={paint(unstyled, fallback(input, () => ({ accentColor: theme.accent, width: ui.iconSize, height: ui.iconSize })), style)} {...partProps(part)} />;
});

export const FootprintBadge = forwardRef<HTMLSpanElement, FootprintBadgeProps>(function FootprintBadge(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize = "default", ...props
  } = input;
  const Custom = useFootprintComponents().Badge;
  if (Custom) return <Custom {...props} ref={ref} style={style} {...partProps(part)} />;
  const ui = componentStyles(densitySize);
  return <span {...props} ref={ref} style={paint(unstyled, fallback(input, () => ({ fontSize: ui.small, borderRadius: ui.radiusBadge, padding: `${ui.spaceXs} ${ui.spaceSm}`, color: theme.textPrimary, background: theme.bgSecondary })), style)} {...partProps(part)} />;
});

export const FootprintCode = forwardRef<HTMLElement, FootprintCodeProps>(function FootprintCode(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize = "default", ...props
  } = input;
  const Custom = useFootprintComponents().Code;
  if (Custom) return <Custom {...props} ref={ref} style={style} {...partProps(part)} />;
  const ui = componentStyles(densitySize);
  return <code {...props} ref={ref} style={paint(unstyled, fallback(input, () => ({ fontFamily: theme.fontMono, fontSize: ui.body })), style)} {...partProps(part)} />;
});

/** Native-title fallback; a host adapter may provide its own tooltip behavior. */
export const FootprintTooltip = forwardRef<HTMLSpanElement, FootprintTooltipProps>(function FootprintTooltip(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize: _size, content, title, ...props
  } = input;
  const Custom = useFootprintComponents().Tooltip;
  if (Custom) return <Custom {...props} ref={ref} content={content} title={title} style={style} {...partProps(part)} />;
  return <span {...props} ref={ref} title={title ?? content} style={paint(unstyled, defaultStyle, style)} {...partProps(part)} />;
});

export const FootprintIcon = forwardRef<HTMLSpanElement, FootprintIconProps>(function FootprintIcon(input, ref) {
  const {
    unstyled, defaultStyle, style, part, densitySize = "default", name, ...props
  } = input;
  const Custom = useFootprintComponents().Icon;
  if (Custom) return <Custom {...props} name={name} ref={ref} style={style} {...partProps(part)} />;
  const ui = componentStyles(densitySize);
  return <span {...props} ref={ref} data-icon={name} style={paint(unstyled, fallback(input, () => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: ui.iconSize, height: ui.iconSize })), style)} {...partProps(part)} />;
});
