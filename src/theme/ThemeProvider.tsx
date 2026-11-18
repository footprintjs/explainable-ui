import { cloneElement, Fragment, isValidElement, createContext, useContext, useMemo, type CSSProperties } from "react";
import type { ThemeTokens } from "./tokens";
import { tokensToCSSVars } from "./tokens";
import { FootprintComponentsContext, useFootprintComponents, type FootprintComponents } from "./components";

const ThemeContext = createContext<ThemeTokens>({});

export function useFootprintTheme(): ThemeTokens {
  return useContext(ThemeContext);
}

export interface FootprintThemeProps {
  tokens?: ThemeTokens;
  /** Native-compatible adapters for host design-system primitives. */
  components?: FootprintComponents;
  /** Apply local variables to a single child instead of adding a DOM wrapper.
   *  Custom children must forward className/style to their root. */
  asChild?: boolean;
  children: React.ReactNode;
}

/**
 * Optional theme provider — wraps children with CSS custom properties.
 * Consumers can also just set --fp-* CSS variables directly.
 *
 * Wrapper div uses `display: contents` so it's invisible to the
 * parent's layout (flex / grid / block). This matters because themed
 * children often need to fill a parent (flex:1 / height:100% /
 * grid cells), and a regular block `<div>` here would break that
 * chain — descendants would resolve to 0 height when the parent is
 * flex-column or a grid cell with minmax(0, 1fr). `display: contents`
 * removes the box from the render tree while keeping the DOM intact,
 * so CSS custom property inheritance (which follows the DOM) still
 * flows to children.
 *
 * Trade-off: `display: contents` elements are removed from the
 * accessibility tree in some older browser versions. Our wrapper has
 * no semantic role, so this is fine.
 */
export function FootprintTheme({ tokens = {}, components, children, asChild = false }: FootprintThemeProps) {
  const parent = useFootprintTheme();
  const parentComponents = useFootprintComponents();
  // Only local declarations are emitted. Omitted fields keep DOM inheritance,
  // including variables set by a host outside React's theme context.
  const cssVars = tokensToCSSVars(tokens);
  const mergedTokens = useMemo<ThemeTokens>(() => {
    const merge = <T extends object>(outer: T | undefined, inner: T | undefined): T | undefined => {
      if (!outer && !inner) return undefined;
      const local = Object.fromEntries(Object.entries(inner ?? {}).filter(([, value]) => value !== undefined));
      return { ...outer, ...local } as T;
    };
    return {
      ...merge(parent, tokens),
      colors: merge(parent.colors, tokens.colors),
      fontFamily: merge(parent.fontFamily, tokens.fontFamily),
      typography: merge(parent.typography, tokens.typography),
      spacing: merge(parent.spacing, tokens.spacing),
      radii: merge(parent.radii, tokens.radii),
      borders: merge(parent.borders, tokens.borders),
      elevation: merge(parent.elevation, tokens.elevation),
      nodes: merge(parent.nodes, tokens.nodes),
      diagram: merge(parent.diagram, tokens.diagram),
      motion: merge(parent.motion, tokens.motion),
      controls: merge(parent.controls, tokens.controls),
    };
  }, [parent, tokens]);
  const mergedComponents = useMemo(() => ({
    ...parentComponents,
    ...Object.fromEntries(Object.entries(components ?? {}).filter(([, value]) => value !== undefined)),
  }), [parentComponents, components]);

  let content = <div
    style={{ ...(cssVars as CSSProperties), display: "contents" }}
    className="fp-theme-root"
  >{children}</div>;
  if (asChild) {
    if (!isValidElement<{ style?: CSSProperties; className?: string }>(children) || children.type === Fragment) {
      throw new Error("FootprintTheme asChild requires one non-fragment React element that forwards className and style.");
    }
    content = cloneElement(children, {
      // Child-authored style stays strongest; cloneElement retains its ref,
      // event handlers and all other props when they are not replaced here.
      style: { ...(cssVars as CSSProperties), ...children.props.style },
      className: [children.props.className, "fp-theme-root"].filter(Boolean).join(" "),
    });
  }

  return (
    <ThemeContext.Provider value={mergedTokens}>
      <FootprintComponentsContext.Provider value={mergedComponents}>
        {content}
      </FootprintComponentsContext.Provider>
    </ThemeContext.Provider>
  );
}
