/**
 * Store chat rules (backend PRD-049 B0 and B0.1, D14–D17)
 *
 * The CHAT button's fallback to WhatsApp, the store's texts with Nahara's
 * defaults, safe answer links, the team's "Back …" line in Asia/Kolkata
 * time, error copy and the sign-in link back to the open chat.
 *
 * Needs kit 1.6.0 (`toStoreChatLinkHref`, `withStoreChatOpen`): on an
 * older kit pin this file fails to import.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const {
  ChatLauncherModeEnum,
  formatTeamBackAt,
  getAskErrorMessage,
  getChatChips,
  getChatLauncherMode,
  getChatSignInHref,
  getChatWelcome,
  getSendErrorMessage,
  getSignInPrompt,
  getTeamStatusLines,
  STORE_CHAT_COPY,
  toAnswerLinks,
} = await import("@/utils/store-chat");

describe("launcher mode", () => {
  it("stays the WhatsApp link without a config (loading or failed)", () => {
    assert.equal(getChatLauncherMode(null), ChatLauncherModeEnum.WHATSAPP);
    assert.equal(getChatLauncherMode(undefined), ChatLauncherModeEnum.WHATSAPP);
  });

  it("stays the WhatsApp link with answers and messages both off", () => {
    assert.equal(
      getChatLauncherMode({ answersEnabled: false, messagingEnabled: false }),
      ChatLauncherModeEnum.WHATSAPP,
    );
  });

  it("opens the panel when answers or messages are on", () => {
    assert.equal(
      getChatLauncherMode({ answersEnabled: true, messagingEnabled: false }),
      ChatLauncherModeEnum.PANEL,
    );
    assert.equal(
      getChatLauncherMode({ answersEnabled: false, messagingEnabled: true }),
      ChatLauncherModeEnum.PANEL,
    );
  });
});

describe("texts", () => {
  it("uses the store's welcome only while its answers are on", () => {
    assert.equal(
      getChatWelcome({ answersEnabled: true, welcome: " Hello there " }),
      "Hello there",
    );
    assert.equal(
      getChatWelcome({ answersEnabled: false, welcome: "Hello there" }),
      STORE_CHAT_COPY.welcome,
    );
    assert.equal(
      getChatWelcome({ answersEnabled: true, welcome: "" }),
      STORE_CHAT_COPY.welcome,
    );
  });

  it("shows quick buttons only with answers on, dropping empty ones", () => {
    const chips = [
      { label: "Shipping", question: "How long does shipping take?" },
      { label: "Returns", question: "" },
      { label: "", question: "Lost" },
    ];
    assert.deepEqual(getChatChips({ answersEnabled: true, chips }), [
      { label: "Shipping", question: "How long does shipping take?" },
      { label: "Returns", question: "Returns" },
    ]);
    assert.deepEqual(getChatChips({ answersEnabled: false, chips }), []);
  });

  it("uses the store's sign-in prompt, else Nahara's", () => {
    assert.equal(getSignInPrompt({ signInPrompt: "Log in" }), "Log in");
    assert.equal(getSignInPrompt({}), STORE_CHAT_COPY.signInPrompt);
  });
});

describe("answer links", () => {
  it("keeps https links and site paths, drops the rest", () => {
    const links = toAnswerLinks([
      { label: "Shipping", url: "/shipping-returns" },
      { label: "Guide", url: "https://example.com/guide" },
      { label: "Bad", url: "javascript:alert(1)" },
      { label: "Plain", url: "http://example.com" },
      { label: "Other host", url: "//evil.example" },
      { label: "", url: "/contact" },
    ]);
    assert.deepEqual(links, [
      { label: "Shipping", href: "/shipping-returns", external: false },
      { label: "Guide", href: "https://example.com/guide", external: true },
    ]);
  });

  it("is empty without links", () => {
    assert.deepEqual(toAnswerLinks(null), []);
  });
});

describe("team status", () => {
  // Monday 23 Nov 2026, 10:00 in Asia/Kolkata
  const backAt = "2026-11-23T04:30:00.000Z";

  it("formats when the team is back in IST", () => {
    const text = formatTeamBackAt(backAt, "en-GB");
    assert.match(text, /Mon/);
    assert.match(text, /23 Nov/);
    assert.match(text, /10:00/);
  });

  it("is empty for a missing or unreadable date", () => {
    assert.equal(formatTeamBackAt(null), "");
    assert.equal(formatTeamBackAt("not a date"), "");
  });

  it("shows away, back and reply time while closed", () => {
    const lines = getTeamStatusLines(
      {
        isOpen: false,
        awayMessage: "We're away",
        nextOpenAt: backAt,
        replyTime: "We reply within a day",
      },
      "en-GB",
    );
    assert.equal(lines.length, 3);
    assert.equal(lines[0], "We're away");
    assert.match(lines[1], /^Back Mon/);
    assert.equal(lines[2], "We reply within a day");
  });

  it("shows only the reply time while open, nothing for empty texts", () => {
    assert.deepEqual(
      getTeamStatusLines({ isOpen: true, awayMessage: "Away", replyTime: "Soon" }),
      ["Soon"],
    );
    assert.deepEqual(getTeamStatusLines({ isOpen: true, replyTime: "" }), []);
  });
});

describe("errors", () => {
  it("has a line for every send refusal and a fallback", () => {
    for (const key of [
      "CHAT_SIGN_IN_REQUIRED",
      "CHAT_MESSAGING_OFF",
      "RATE_LIMITED",
      "TOO_LONG",
    ]) {
      assert.ok(getSendErrorMessage(key));
    }
    assert.match(getSendErrorMessage("SOMETHING_ELSE"), /couldn't send/);
    assert.equal(getSendErrorMessage(null), "");
  });

  it("tells a fast asker to wait", () => {
    assert.match(getAskErrorMessage("RATE_LIMITED"), /wait/);
    assert.equal(getAskErrorMessage("NETWORK"), STORE_CHAT_COPY.askFailed);
  });
});

describe("sign-in link", () => {
  it("returns to this page with the chat open", () => {
    const href = getChatSignInHref("/products/ring?size=7");
    assert.ok(href.startsWith("/login?next="));
    const next = decodeURIComponent(href.slice("/login?next=".length));
    assert.equal(next, "/products/ring?size=7&chat=open");
  });

  it("falls back to the home page", () => {
    const next = decodeURIComponent(
      getChatSignInHref("").slice("/login?next=".length),
    );
    assert.equal(next, "/?chat=open");
  });
});
