/**
 * Store chat helpers (backend PRD-049 steps B0 and B0.1, D14–D17).
 *
 * Nahara's words and rules around the kit's store chat engine
 * (`useStoreChatConfig` / `useStoreChat`, kit 1.6.0):
 * - the CHAT button opens the chat panel, or stays the WhatsApp link it
 *   always was while the store has neither answers nor messages on (or
 *   the chat config can't be read);
 * - answer links go through the kit's safe href check;
 * - "Back Mon, 23 Nov, 10:00 am" while the team is away, in the store's
 *   time zone (Asia/Kolkata) and the shopper's locale;
 * - the sign-in link returns to this page with the chat open.
 *
 * No React. Behaviour twin of deveshe's `utils/assistant-replies.util.js`
 * (store-chat part); the look is Nahara's own.
 */

import {
  isExternalStoreChatLink,
  toStoreChatLinkHref,
  withStoreChatOpen,
} from "@zcom/storefront-kit/core";

// ─── Constants ────────────────────────────────────────────────────────────

/** The CHAT button's old target, kept as the fallback (and in the menus). */
export const WHATSAPP_CHAT_URL = "https://wa.me/+919137159898";

/** The store's time zone, for "Back …". */
export const TEAM_TIME_ZONE = "Asia/Kolkata";

/** At most this many links under one answer. */
const MAX_ANSWER_LINKS = 5;

export const ChatLauncherModeEnum = {
  WHATSAPP: "WHATSAPP",
  PANEL: "PANEL",
};

export const STORE_CHAT_COPY = {
  title: "Chat with Nahara",
  welcome: "Hi! How can we help you today?",
  talkWelcome: "Write to us and our team will get back to you here.",
  askPlaceholder: "Ask a question",
  messagePlaceholder: "Write your message",
  talkToUs: "Talk to us",
  messageTeam: "Message the team",
  didYouMean: "Did you mean",
  noAnswer: "Sorry, we don't have an answer to that yet.",
  askFailed: "We couldn't reach the store just now. Please try again.",
  signInPrompt: "Sign in to message us. We'll keep what you've typed.",
  signIn: "Sign in",
  draftRestored: "Here's the message you started.",
  dontSend: "Don't send",
  emptyThread: "No messages yet. Write to us below.",
  loadingThread: "Loading your messages…",
  loadingChat: "Loading chat…",
  unavailable: "Chat isn't available right now.",
  whatsapp: "Chat on WhatsApp",
  messagingOff: "The store isn't taking messages here right now.",
  replyByEmail: "We'll also email you when we reply.",
  teamBack: (when) => `Back ${when}`,
};

const SEND_ERROR_COPY = {
  CHAT_SIGN_IN_REQUIRED: STORE_CHAT_COPY.signInPrompt,
  CHAT_MESSAGING_OFF: STORE_CHAT_COPY.messagingOff,
  RATE_LIMITED: "You've sent a lot of messages. Please try again a little later.",
  TOO_LONG: "That message is too long. Please shorten it.",
  REQUIRED: "Write a message first.",
  NETWORK: "You seem to be offline. Please try again.",
};

const DEFAULT_SEND_ERROR = "We couldn't send your message. Please try again.";

// ─── Launcher ─────────────────────────────────────────────────────────────

/**
 * PANEL once the store has answers or messages on; WHATSAPP otherwise,
 * including while the config loads or when it can't be read (the button
 * then works exactly as before).
 */
export const getChatLauncherMode = (config) =>
  config && (config.answersEnabled || config.messagingEnabled)
    ? ChatLauncherModeEnum.PANEL
    : ChatLauncherModeEnum.WHATSAPP;

// ─── Texts ────────────────────────────────────────────────────────────────

/** The store's welcome while its answers are on, else Nahara's. */
export const getChatWelcome = (config) =>
  (config?.answersEnabled && String(config.welcome || "").trim()) ||
  STORE_CHAT_COPY.welcome;

/** The quick buttons (only while the store's answers are on). */
export const getChatChips = (config) =>
  config?.answersEnabled
    ? (config.chips || [])
        .map((chip) => ({
          label: String(chip?.label || "").trim(),
          question: String(chip?.question || chip?.label || "").trim(),
        }))
        .filter((chip) => chip.label && chip.question)
    : [];

/** The store's sign-in words, else Nahara's. */
export const getSignInPrompt = (config) =>
  String(config?.signInPrompt || "").trim() || STORE_CHAT_COPY.signInPrompt;

/** An answer's links as `{label, href, external}` (unsafe ones dropped). */
export const toAnswerLinks = (links) =>
  (links || [])
    .map((link) => {
      const href = toStoreChatLinkHref(link?.url);
      const label = String(link?.label || "").trim();
      if (!href || !label) return null;
      return { label, href, external: isExternalStoreChatLink(href) };
    })
    .filter(Boolean)
    .slice(0, MAX_ANSWER_LINKS);

// ─── Team status (B0.1) ───────────────────────────────────────────────────

/**
 * When the team is back ("Mon, 23 Nov, 10:00 am" in the shopper's
 * locale, Asia/Kolkata time), or "" for a missing or unreadable date.
 */
export const formatTeamBackAt = (iso, locale = undefined) => {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: TEAM_TIME_ZONE,
    }).format(date);
  } catch {
    return "";
  }
};

/**
 * The lines near the message box: while the team is out (`isOpen`
 * false) its away message and when it is back, then the reply time.
 * Shoppers can message either way. Empty texts are left out.
 */
export const getTeamStatusLines = (status, locale = undefined) => {
  const lines = [];
  if (status && status.isOpen === false) {
    const away = String(status.awayMessage || "").trim();
    if (away) lines.push(away);
    const back = formatTeamBackAt(status.nextOpenAt, locale);
    if (back) lines.push(STORE_CHAT_COPY.teamBack(back));
  }
  const replyTime = String(status?.replyTime || "").trim();
  if (replyTime) lines.push(replyTime);
  return lines;
};

// ─── Errors ───────────────────────────────────────────────────────────────

/** Nahara's line for a failed send (the kit's `send` error key). */
export const getSendErrorMessage = (key) =>
  key ? SEND_ERROR_COPY[key] || DEFAULT_SEND_ERROR : "";

/** Nahara's line for a failed question (`RATE_LIMITED` or anything else). */
export const getAskErrorMessage = (reason) =>
  reason === "RATE_LIMITED"
    ? "You're asking quickly. Please wait a moment and try again."
    : STORE_CHAT_COPY.askFailed;

// ─── Sign-in ──────────────────────────────────────────────────────────────

/**
 * `/login?next=<path with ?chat=open>`: signing in comes back to this
 * page with the chat open (the login pages honour `next` through
 * `utils/redirect.js`).
 */
export const getChatSignInHref = (path) =>
  `/login?next=${encodeURIComponent(withStoreChatOpen(path || "/"))}`;
