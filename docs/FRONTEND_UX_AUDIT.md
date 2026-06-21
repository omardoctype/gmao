# Frontend UX, Responsive Overlay and Accessibility Audit

Branch: `fix/frontend-ux-overlays`

Date: 2026-06-21

## Frontend Structure

- Frontend directory: `frontend`
- Build stack: React, Vite, TypeScript, Tailwind CSS
- UI convention: shadcn-style project configuration via `frontend/components.json`
- Installed Radix packages: `@radix-ui/react-slot` only
- Floating UI: not installed; not needed for the issues fixed in this pass
- Playwright: not installed
- Tailwind config: `frontend/tailwind.config.js`

## Overlay Strategy

The app did not have Radix Dialog, Popover, DropdownMenu, Select, Tooltip, Sheet, or Drawer installed. Existing UI used custom components and native selects.

Implemented an internal overlay strategy:

- `OverlayPortal` renders overlays to `document.body`
- `useModalOverlay` locks body scroll, handles Escape, traps focus, restores focus, and supports nested overlay stacks
- `ResponsiveCrudPanel` now uses the portal/focus/scroll-lock lifecycle
- `ResponsiveSidePanel` provides the same behavior for right-side drawers and mobile bottom-sheet layout
- `AnchoredPopover` renders topbar menus in a portal and clamps them inside the viewport with 12px collision padding and 8px offset
- Layer scale documented in CSS:
  - sticky: `z-layer-sticky`
  - mobile sidebar backdrop: `z-layer-mobile-sidebar-backdrop`
  - mobile sidebar: `z-layer-mobile-sidebar`
  - popovers: `z-layer-popover`
  - dialogs/backdrops: `z-layer-dialog-backdrop`, `z-layer-dialog`
  - toasts: `z-layer-toast`

## Issues Found and Fixes

| Area | Visible problem | Root cause | Impact | Correction | Validation result |
| --- | --- | --- | --- | --- | --- |
| User profile menu | Menu could be clipped or leave viewport near the topbar edge. | Absolute positioning inside the header using `right-0` and manual top offset. | Profile/logout actions could become hard to reach on small screens. | Replaced with `AnchoredPopover` rendered through a portal and clamped to viewport. | Build passed; static scan confirms no remaining manual topbar menu positioning. |
| Notification panel | Panel could be clipped by header/layout and lacked robust Escape behavior. | Absolute top/right positioning and local click-outside handling. | Notifications could be inaccessible near viewport edges. | Replaced with `AnchoredPopover`; added trigger state, Escape close, outside close, refresh label. | Build passed; static scan confirms portal popover strategy. |
| Create/edit dialogs | Panels did not render through a portal and had partial modal behavior. | `ResponsiveCrudPanel` rendered inline and only listened for Escape. | Risk of clipping, background scroll, and weak focus handling. | Added portal, focus trap, body scroll lock, dialog labelling, focus restore. | Build passed. |
| Details/status/assignment drawers | Custom fixed drawers repeated overlay markup with no focus trap or scroll lock. | Per-component fixed backdrops and side panels. | Keyboard users could tab behind panels; body could remain scrollable. | Migrated breakdown, work order, stock movement, user roles, and equipment details to `ResponsiveSidePanel`. | Build passed. |
| Equipment document preview | Nested preview used arbitrary `z-[60]`/`z-[70]` and custom modal shell. | One-off nested overlay implementation. | Layer conflicts and Escape could close the wrong overlay. | Moved preview to `ResponsiveCrudPanel`; nested modal stack closes the top overlay first. | Build passed; arbitrary z-index removed. |
| Tables on mobile | Row actions could be lost at the far right inside horizontal scrolling tables. | Wide tables used overflow scroll, but action columns were not sticky. | Common actions were hard to reach on narrow screens. | Made action columns sticky on equipment, breakdowns, work orders, maintenance plans, spare parts, users, and predictive risk tables. | Build passed. |
| Table horizontal scrolling | Scroll container was not keyboard focusable. | Table wrapper was a plain overflow div. | Keyboard users had no reliable focus target for horizontal scroll. | Added focusable `role="region"` wrapper with visible focus ring. | Build passed. |
| Icon-only row actions | Several buttons had icons without accessible action names. | Missing `aria-label` on table/document icon buttons. | Screen reader users could not distinguish actions. | Added specific labels for view/edit/delete/status/assign/start/close/stock/document actions. | Build passed. |
| Form validation messages | Inputs were not programmatically linked to errors/hints. | `FormField` rendered messages but did not set `aria-describedby` or `aria-invalid`. | Validation was less clear to assistive tech. | `FormField` now links child controls to hint/error text and uses `role="alert"` for errors. | Build passed. |
| Role checkbox group | Custom checkbox group did not accept ARIA linkage from `FormField`. | Component props did not extend div attributes. | Role validation was less accessible. | Added `HTMLAttributes`, `role="group"`, ARIA passthrough. | Build passed. |
| Mobile sidebar/topbar layers | Numeric z-index values were scattered across layout pieces. | Direct `z-30`, `z-40`, `z-[60]`, `z-[70]` classes. | Increased risk of overlay conflicts. | Replaced with named layer utilities; removed synchronous menu-close effects. | Build passed. |

## Components Changed

- `frontend/src/components/ui/overlay.tsx`
- `frontend/src/components/ui/overlay-hooks.ts`
- `frontend/src/components/ui/responsive-crud-panel.tsx`
- `frontend/src/components/ui/form-field.tsx`
- `frontend/src/components/ui/table.tsx`
- `frontend/src/components/ui/toast-stack.tsx`
- `frontend/src/components/layout/LayoutUserMenu.tsx`
- `frontend/src/components/layout/LayoutNotificationsPanel.tsx`
- `frontend/src/components/layout/LayoutTopbar.tsx`
- `frontend/src/components/layout/LayoutSidebar.tsx`
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/components/equipments/EquipmentDetailsDrawer.tsx`
- `frontend/src/components/breakdowns/BreakdownDetailsDrawer.tsx`
- `frontend/src/components/breakdowns/BreakdownStatusDrawer.tsx`
- `frontend/src/components/work-orders/WorkOrderDetailsDrawer.tsx`
- `frontend/src/components/work-orders/WorkOrderAssignDrawer.tsx`
- `frontend/src/components/stock/StockMovementDrawer.tsx`
- `frontend/src/components/users/UserRolesDrawer.tsx`
- table components for equipment, breakdown, work order, maintenance plan, spare part, user, and predictive risk rows
- `frontend/src/index.css`

## Responsive Checks

Reviewed and adjusted behavior for:

- 320px: mobile panels use full width with bottom-sheet sizing; sticky actions remain reachable in horizontal tables.
- 375px: dialogs use safe mobile height and internal scrolling.
- 768px: panels retain constrained width and table scroll remains keyboard focusable.
- 1024px: desktop side panels align right and no longer rely on component-local fixed markup.
- 1440px: topbar popovers align to their trigger and remain on the viewport edge.

Browser screenshot automation was not added because Playwright is not installed and authenticated pages require a live backend profile request. Validation completed with static overlay scans and production build.

## Accessibility Improvements

- Escape handling added for CRUD panels, side panels, nested preview modal, and topbar popovers.
- Focus moves inside modal/side panels and returns to the trigger on close.
- Body scroll locks while modal/side panels are open.
- Icon-only buttons now have accurate labels.
- Form errors are announced and linked to the relevant controls.
- Horizontal table scroll regions are keyboard focusable.
- Notification and user menu triggers expose expanded state.

## Automated Checks

- `npm ci`: passed; restored missing local frontend binaries.
- `npm run build`: passed.
- `npm run lint`: failed on existing project lint baseline.

Lint baseline examples:

- Fast Refresh rule failures in badge/context/ui files that export non-component helpers.
- Empty interface rules in `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, and `user-service.ts`.
- Existing hook dependency warnings across several pages.
- `AiStructuredAnswer.tsx` has a `no-useless-escape` error.

No `test` script and no Playwright setup were present in `frontend/package.json`.

## Remaining Limitations

- No automated viewport screenshots were produced in this pass.
- Lint still fails on pre-existing baseline issues outside the overlay/accessibility changes.
- Native `<select>` controls remain in use; no custom Floating UI select was introduced because native selects avoid clipping and preserve platform accessibility.
- A production bundle-size warning remains from Vite for the main JS chunk.
