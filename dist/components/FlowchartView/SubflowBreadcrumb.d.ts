import type { BreadcrumbEntry } from "./useSubflowNavigation";
export interface SubflowBreadcrumbProps {
    breadcrumbs: BreadcrumbEntry[];
    onNavigate: (level: number) => void;
}
/**
 * Breadcrumb bar for subflow drill-down navigation.
 * Shows: Root > SubflowA > SubflowB — clicking any crumb navigates back.
 */
export declare const SubflowBreadcrumb: import("react").NamedExoticComponent<SubflowBreadcrumbProps>;
//# sourceMappingURL=SubflowBreadcrumb.d.ts.map