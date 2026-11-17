import { createContext, useContext, type ReactNode } from 'react';
import { useCreateController, type LensControllerOwner } from './useController';
import type { LensController, LensControllerOptions } from './types';

const ControllerContext = createContext<LensControllerOwner | null>(null);
export interface LensControllerProviderProps extends LensControllerOptions { children?: ReactNode }

/** One renderless React owner for every participating view. Source disposal stays with its creator. */
export function LensControllerProvider({ children, ...options }: LensControllerProviderProps) {
  const parent = useContext(ControllerContext);
  if (parent) throw new Error('LensControllerProvider must not nest another controller. Reuse the existing provider.');
  return <OwnedController options={options}>{children}</OwnedController>;
}
function OwnedController({ options, children }: { options: LensControllerOptions; children?: ReactNode }) {
  const controller = useCreateController(options);
  return <ControllerContext.Provider value={controller}>{children}</ControllerContext.Provider>;
}
export function useLensController(): LensController {
  const controller = useContext(ControllerContext);
  if (!controller) throw new Error('useLensController must be used inside LensControllerProvider or ExplainableShell.');
  return controller.value;
}
/** @internal Shell adapter; never exported from a package entry. */
export function useOptionalControllerOwner(): LensControllerOwner | null { return useContext(ControllerContext); }
