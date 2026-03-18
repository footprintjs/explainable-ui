import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { theme } from "../../theme";
/**
 * Breadcrumb bar for subflow drill-down navigation.
 * Shows: Root > SubflowA > SubflowB — clicking any crumb navigates back.
 */
export const SubflowBreadcrumb = memo(function SubflowBreadcrumb({ breadcrumbs, onNavigate, }) {
    if (breadcrumbs.length <= 1)
        return null;
    return (_jsx("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            background: theme.bgSecondary,
            borderBottom: `1px solid ${theme.border}`,
            fontSize: 12,
            fontFamily: theme.fontSans,
            flexShrink: 0,
            overflowX: "auto",
        }, children: breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (_jsxs("span", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [i > 0 && (_jsx("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" })), isLast ? (_jsxs("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [_jsx("span", { style: {
                                    color: theme.primary,
                                    fontWeight: 600,
                                }, children: crumb.label }), crumb.description && (_jsxs("span", { style: {
                                    color: theme.textMuted,
                                    fontWeight: 400,
                                    fontSize: 11,
                                }, children: ["\u2014 ", crumb.description] }))] })) : (_jsx("button", { onClick: () => onNavigate(i), style: {
                            background: "none",
                            border: "none",
                            color: theme.textSecondary,
                            cursor: "pointer",
                            padding: "2px 4px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontFamily: "inherit",
                            fontWeight: 500,
                            transition: "color 0.15s",
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.color = `${theme.primary}`;
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.color = `${theme.textSecondary}`;
                        }, children: crumb.label }))] }, `${crumb.label}-${i}`));
        }) }));
});
//# sourceMappingURL=SubflowBreadcrumb.js.map