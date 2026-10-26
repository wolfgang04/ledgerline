# Ledgerline

Ledgerline makes financial operations feel clear, collaborative, and dependable.

## Palette

- Navigation: navy `#132B35`, with pale text and mint active indicators.
- Primary action: emerald `#047857`, with white text.
- Canvas: warm mist `#F4F7F5`; cards and popovers: white.
- Body text: ink `#172E35`; secondary text: slate `#51666C`.
- Success: green; information: blue; attention: amber; destructive: red.

Use semantic Tailwind colors defined in `app/globals.css`. Pair status color with an icon and a written message. Decorative card colors do not imply permissions or financial status.

## Type and layout

Use Geist with system fallbacks. Page headings use tight tracking and semibold weight; body text stays readable at 14-16px. Use tabular numerals for metrics and money. Follow the Tailwind spacing scale, with 24px desktop section gaps and 16px mobile padding. Keep operational tables compact and horizontally scrollable.

## Components and behavior

Compose shadcn primitives from `components/ui`. Keep custom components for domain concepts. Use one primary action per section, outlined secondary actions, and destructive styling only for destructive operations. Use explicit pending labels, preserve values on failure, and explain empty states with a next step. Never invent financial figures or show controls for unavailable features.

The geometric mark represents a ledger corner and its next entry. Reuse `LedgerlineMark` or `Brand`; the browser icon uses the same geometry. The current theme is light with navy navigation. Respect reduced motion and maintain visible keyboard focus. On mobile, collapse navigation into the accessible sheet.

Geist and Geist Mono are self-hosted from `app/fonts` (Latin variable fonts, SIL OFL 1.1). They were copied from the installed Next.js distribution; attribution and license accompany them. No font download is required during builds.
