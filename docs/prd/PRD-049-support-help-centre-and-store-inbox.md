# PRD-049 — Support, help centre and store inbox: the store chat (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-11-21 (this repo's part of steps B0 and B0.1, D14–D17; working tree, not committed, not browser-tested) |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-049-support-help-centre-and-store-inbox.md`](../../../../zcom-backend/docs/prd/PRD-049-support-help-centre-and-store-inbox.md) (§8.1 D14–D17, §9 B0/B0.1, §10 logs) |
| Approved by / on | Anand (owner), backend PRD-049 D14–D15 (2026-11-20), D16–D17 (2026-11-20/21) |
| Needs | **Kit 1.6.0** (`useStoreChatConfig`, `useStoreChat`, `takeStoreChatOpenRequest`, `withStoreChatOpen`, `toStoreChatLinkHref`, `STORE_CHAT_*`; unreleased, working tree). `package.json` still pins `#v1.5.0`, so `npm test` (`test/store-chat.test.mjs`) and `npm run build` fail on the missing exports until the pin moves. Backend: the notification `StoreChat*` operations deployed with their indexes. Contract: `zcom-backend/docs/architecture/storefront-api-contract.md` "Store chat" |

This file holds only Nahara's notes. Requirements, contract and decisions are in the backend PRD. Deveshe Dreams has the same behaviour in its own assistant (its `DD-PRD-001` D14 / §12); Nahara's look is its own.

## UX (Nahara)

- **The CHAT pill** (bottom right, `Layout.jsx`, GSAP fade-in kept) opens the chat panel when the store's chat config has answers or messages on. With both off, while the config loads, or when it can't be read, it stays the WhatsApp link it always was (`https://wa.me/+919137159898`, new tab). The WhatsApp links in the header and footer menus are unchanged.
- **Panel:** white, green `#174d38` border and buttons, Railway type, a header "Chat with Nahara" with "Talk to us" (while the store takes messages) and a close button; desktop 24 rem wide above the pill, phones a full-width bottom sheet (85 svh, page scroll stopped). Opens and closes with transform and opacity only; none under `prefers-reduced-motion`. Loaded with `next/dynamic` on the first open (or `?chat=open`), then kept mounted.
- **Answers** (store answers on): the store's welcome (Nahara's "Hi! How can we help you today?" otherwise), its quick buttons (tap = ask), a question box; each answer shows its links (the kit's safe href check; site paths in the same tab, https links in a new one), "Did you mean" suggestions (tap = ask) and a quiet "Talk to us" when `offerPerson`. A miss (`matched === false`) ends with **"Message the team"** (or "Chat on WhatsApp" when the store takes no messages: never a dead end). A failed question says so (`RATE_LIMITED`: "please wait a moment") and offers the team.
- **Answers off:** no bot answers; the welcome, then straight to Talk to us.
- **Talk to us:** signed in, the thread (shopper on the right in green, store on the left; polled by the kit while open), "Loading your messages…" / "No messages yet" states and a message box (Enter sends, Shift+Enter new line). "Talk to us" from an answer puts the question in an empty box. A guest sees the store's `signInPrompt` and "Sign in" → `/login?next=<this page>?chat=open` (the login pages honour `next` through `utils/redirect.js`); the typed message is kept by the kit (on Send or on the Sign in tap) and, after signing in, `?chat=open` opens the panel with it in the box, "Here's the message you started" and "Don't send" (`discardDraft`). Never sent without the shopper's tap.
- **Team status:** the store's reply time above the message box; while closed (`isOpen` false) the away message and "Back Mon, 23 Nov, 10:00 am" (`nextOpenAt`, shopper's locale, Asia/Kolkata) and "We'll also email you when we reply"; sending still works.
- **Errors:** `CHAT_MESSAGING_OFF` (with the WhatsApp link), `RATE_LIMITED`, `TOO_LONG`, sign-in required, network: friendly lines (`utils/store-chat.js`).
- **Accessibility:** `role="dialog"`, `aria-modal`, labelled by the title; `useDialogA11y` (focus in, Tab trapped, Escape closes, focus back to the CHAT button); the pill is a `<button>` with `aria-haspopup` / `aria-expanded` (a labelled link in WhatsApp mode); icon-only buttons have `aria-label`s; the transcript is a polite `role="log"`; inputs are 16 px (no iOS zoom).

## As built (2026-11-21)

- `src/components/chat/StoreChatLauncher.jsx` (the pill, mode from `getChatLauncherMode`, `?chat=open` through the kit's `takeStoreChatOpenRequest` on every route change), `src/components/chat/StoreChat.jsx` (the panel on `useStoreChat({ open })`), `src/utils/store-chat.js` (copy, launcher rule, welcome / chips / sign-in prompt defaults, answer links, `formatTeamBackAt`, `getTeamStatusLines`, error lines, `getChatSignInHref`), `src/styles/components/common/storeChat.css` (imported in `allCssImport.css`); `Layout.jsx` renders the launcher in place of the old link; the pill's padding moved from `.whatsapp_chat` to `.whatsapp_chat_link` so the whole pill clicks.
- No GraphQL document here (the kit's hook holds the four operations; `test/kit-documents.test.mjs` unchanged); `validate:ops` 45/45 unchanged.
- **Tests:** `test/store-chat.test.mjs` (16). Against the working-tree kit's `dist` (resolve hook, node_modules untouched) `npm test` 164/164; on the pinned v1.5.0 kit only that file fails (`isExternalStoreChatLink` not exported).

## Open

- Move the kit pin to `#v1.6.0` once tagged (`package.json`, lockfile, `allowScripts`), after the backend deploy (PRD-049 release order).
- Browser pass on desktop and mobile with the store's answers on and off, a guest sign-in round trip and a staff reply from the Inbox.
- The `/gifs/whatsapp.gif` icon stays on the pill in panel mode (owner may want a chat icon).
