"use client";

/**
 * Store chat panel (backend PRD-049 B0 and B0.1, D14–D17).
 *
 * Opened by the floating CHAT button (`StoreChatLauncher`) and loaded
 * only then (`next/dynamic`). The engine is the kit's `useStoreChat`:
 * - **Answers** (the store's FAQs, edited in the dashboard's Inbox ›
 *   Chat answers): welcome, quick buttons, a question box, answers with
 *   their links and "Did you mean" suggestions. A quiet "Talk to us"
 *   sits under every answer that offers a person; a miss ends with
 *   "Message the team". With the store's answers off, the chat goes
 *   straight to Talk to us.
 * - **Talk to us** (signed-in shoppers, D15): the thread (polled by the
 *   kit while the panel is open) and a message box. A guest's message is
 *   kept by the kit through sign-in and offered back afterwards
 *   (`pendingDraft`), never sent without the shopper's tap. The reply
 *   time, and while the team is out the away message and "Back …", sit
 *   by the message box; messages go either way.
 *
 * Dialog behaviour (focus in and back, Tab trapped, Escape) is
 * `useDialogA11y`; below 750 px the panel is a full-width sheet.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiArrowLeftLine,
  RiCloseLine,
  RiSendPlane2Line,
} from "@remixicon/react";
import { useStoreChat } from "@zcom/storefront-kit/client";
import {
  STORE_CHAT_ASK_MAX_LENGTH,
  STORE_CHAT_MESSAGE_MAX_LENGTH,
  STORE_CHAT_SIGN_IN_REASON,
} from "@zcom/storefront-kit/core";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { getErrorInfo } from "@/utils/errors";
import {
  getAskErrorMessage,
  getChatChips,
  getChatSignInHref,
  getChatWelcome,
  getSendErrorMessage,
  getSignInPrompt,
  getTeamStatusLines,
  STORE_CHAT_COPY,
  toAnswerLinks,
  WHATSAPP_CHAT_URL,
} from "@/utils/store-chat";

// ─── Constants ────────────────────────────────────────────────────────────

const ViewEnum = {
  ANSWERS: "ANSWERS",
  TALK: "TALK",
};

const SMALL_SCREEN_QUERY = "(max-width: 749px)";

// ─── Helpers ──────────────────────────────────────────────────────────────

const currentPath = (pathname) => {
  if (typeof window === "undefined") return pathname || "/";
  return `${window.location.pathname}${window.location.search}`;
};

const WhatsAppLink = () => (
  <a
    className="store_chat_whatsapp text-sm"
    href={WHATSAPP_CHAT_URL}
    target="_blank"
    rel="noopener noreferrer"
  >
    {STORE_CHAT_COPY.whatsapp}
  </a>
);

// ─── Component ────────────────────────────────────────────────────────────

const StoreChat = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const messageRef = useRef(null);
  const entryIdRef = useRef(0);
  const offeredDraftRef = useRef(null);

  const chat = useStoreChat({ open: isOpen });
  const {
    config,
    configLoading,
    answersEnabled,
    ask,
    canTalkToUs,
    signedIn,
    messagingEnabled,
    send,
    saveDraft,
    pendingDraft,
    discardDraft,
    sending,
    sendError,
    messages,
    threadLoaded,
  } = chat;

  const [view, setView] = useState(ViewEnum.ANSWERS);
  const [entries, setEntries] = useState([]);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");
  const [asking, setAsking] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);

  useDialogA11y(panelRef, isOpen, onClose);

  // With the store's answers off there is only Talk to us
  const activeView = answersEnabled ? view : ViewEnum.TALK;

  // ─── Effects ─────────────────────────────────────────────────────────

  // The page stays put behind the full-width sheet on phones
  useEffect(() => {
    if (!isOpen || !window.matchMedia?.(SMALL_SCREEN_QUERY).matches) {
      return undefined;
    }
    window.lenis?.stop();
    return () => window.lenis?.start();
  }, [isOpen]);

  // Back from signing in: offer the kept message, never send it for them
  useEffect(() => {
    if (!isOpen || !pendingDraft) return;
    if (offeredDraftRef.current === pendingDraft) return;
    offeredDraftRef.current = pendingDraft;
    setView(ViewEnum.TALK);
    setMessage((current) => (current.trim() ? current : pendingDraft));
    setDraftNotice(true);
  }, [isOpen, pendingDraft]);

  // Newest line in view
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [entries, messages, activeView, asking]);

  // ─── Answers ─────────────────────────────────────────────────────────

  const addEntry = useCallback((entry) => {
    entryIdRef.current += 1;
    const id = `entry-${entryIdRef.current}`;
    setEntries((current) => [...current, { id, ...entry }]);
  }, []);

  const askQuestion = async (raw) => {
    const text = String(raw || "").trim();
    if (!text || asking) return;
    setQuestion("");
    addEntry({ role: "shopper", text });
    setAsking(true);
    try {
      const answer = await ask(text);
      const reply = String(answer?.answer || "").trim();
      addEntry({
        role: "bot",
        question: text,
        matched: !!answer?.matched,
        text: reply || (answer?.matched ? "" : STORE_CHAT_COPY.noAnswer),
        links: toAnswerLinks(answer?.links),
        suggestions: (answer?.suggestions || []).filter(
          (suggestion) => suggestion?.question,
        ),
        offerPerson: !!answer?.offerPerson,
      });
    } catch (error) {
      const { code, reason } = getErrorInfo(error);
      addEntry({
        role: "bot",
        question: text,
        matched: false,
        text: getAskErrorMessage(reason || code),
        links: [],
        suggestions: [],
        offerPerson: true,
      });
    } finally {
      setAsking(false);
    }
  };

  const onAskSubmit = (event) => {
    event.preventDefault();
    askQuestion(question);
  };

  // ─── Talk to us ──────────────────────────────────────────────────────

  const openTalk = (prefill = "") => {
    setView(ViewEnum.TALK);
    if (prefill) {
      setMessage((current) => (current.trim() ? current : prefill));
    }
    requestAnimationFrame(() => messageRef.current?.focus());
  };

  const sendMessage = async () => {
    const body = message.trim();
    if (!body || sending) return;
    const result = await send(body);
    if (!result.error) {
      setMessage("");
      setDraftNotice(false);
    }
  };

  const onMessageSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const onMessageKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const onDontSend = () => {
    discardDraft();
    setMessage("");
    setDraftNotice(false);
    messageRef.current?.focus();
  };

  const onSignInClick = () => {
    // Kept for after signing in (the kit's draft), then the chat reopens
    if (message.trim()) saveDraft(message);
    onClose();
  };

  // ─── Render pieces ───────────────────────────────────────────────────

  const renderAnswerActions = (entry) => {
    if (entry.role !== "bot") return null;
    if (!entry.matched) {
      if (canTalkToUs) {
        return (
          <button
            type="button"
            className="store_chat_team_btn text-sm"
            onClick={() => openTalk(entry.question)}
          >
            {STORE_CHAT_COPY.messageTeam}
          </button>
        );
      }
      return <WhatsAppLink />;
    }
    if (entry.offerPerson && canTalkToUs) {
      return (
        <button
          type="button"
          className="store_chat_quiet_btn text-xs"
          onClick={() => openTalk(entry.question)}
        >
          {STORE_CHAT_COPY.talkToUs}
        </button>
      );
    }
    return null;
  };

  const renderEntry = (entry) => (
    <li
      key={entry.id}
      className={`store_chat_row store_chat_row_${
        entry.role === "shopper" ? "mine" : "theirs"
      }`}
    >
      {entry.text && (
        <p className="store_chat_bubble text-sm">{entry.text}</p>
      )}
      {entry.links?.length > 0 && (
        <ul className="store_chat_links">
          {entry.links.map((link) => (
            <li key={`${entry.id}-${link.href}`}>
              {link.external ? (
                <a
                  className="text-sm"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <Link className="text-sm" href={link.href} onClick={onClose}>
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {entry.suggestions?.length > 0 && (
        <div className="store_chat_suggestions">
          <p className="text-xs thin">{STORE_CHAT_COPY.didYouMean}</p>
          {entry.suggestions.map((suggestion) => (
            <button
              key={`${entry.id}-${suggestion.id || suggestion.question}`}
              type="button"
              className="store_chat_chip text-xs"
              onClick={() => askQuestion(suggestion.question)}
            >
              {suggestion.question}
            </button>
          ))}
        </div>
      )}
      {renderAnswerActions(entry)}
    </li>
  );

  const renderAnswers = () => {
    const chips = getChatChips(config);
    return (
      <>
        <ol
          ref={listRef}
          className="store_chat_list"
          role="log"
          aria-live="polite"
          data-lenis-prevent
        >
          <li className="store_chat_row store_chat_row_theirs">
            <p className="store_chat_bubble text-sm">
              {getChatWelcome(config)}
            </p>
            {chips.length > 0 && (
              <div className="store_chat_chips">
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    className="store_chat_chip text-xs"
                    disabled={asking}
                    onClick={() => askQuestion(chip.question)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </li>
          {entries.map(renderEntry)}
          {asking && (
            <li className="store_chat_row store_chat_row_theirs">
              <p className="store_chat_bubble store_chat_typing text-sm">
                …
              </p>
            </li>
          )}
        </ol>
        <form className="store_chat_form" onSubmit={onAskSubmit}>
          <input
            className="store_chat_input text-sm"
            type="text"
            value={question}
            maxLength={STORE_CHAT_ASK_MAX_LENGTH}
            placeholder={STORE_CHAT_COPY.askPlaceholder}
            aria-label={STORE_CHAT_COPY.askPlaceholder}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button
            type="submit"
            className="store_chat_send"
            aria-label="Ask"
            disabled={asking || !question.trim()}
          >
            <RiSendPlane2Line size={18} aria-hidden="true" />
          </button>
        </form>
      </>
    );
  };

  const renderThread = () => {
    if (!signedIn) {
      return (
        <li className="store_chat_row store_chat_row_theirs">
          <p className="store_chat_bubble text-sm">
            {STORE_CHAT_COPY.talkWelcome}
          </p>
        </li>
      );
    }
    if (!threadLoaded) {
      return (
        <li className="store_chat_row store_chat_note">
          <p className="text-xs thin">{STORE_CHAT_COPY.loadingThread}</p>
        </li>
      );
    }
    if (!messages.length) {
      return (
        <li className="store_chat_row store_chat_note">
          <p className="text-xs thin">{STORE_CHAT_COPY.emptyThread}</p>
        </li>
      );
    }
    return messages.map((item) => (
      <li
        key={item.id}
        className={`store_chat_row store_chat_row_${
          item.from === "SHOPPER" ? "mine" : "theirs"
        }`}
      >
        <p className="store_chat_bubble text-sm">{item.text}</p>
      </li>
    ));
  };

  const renderTalk = () => {
    const statusLines = getTeamStatusLines(chat);
    const needsSignIn =
      !signedIn || sendError === STORE_CHAT_SIGN_IN_REASON;
    const errorLine =
      sendError && sendError !== STORE_CHAT_SIGN_IN_REASON
        ? getSendErrorMessage(sendError)
        : "";
    return (
      <>
        <ol
          ref={listRef}
          className="store_chat_list"
          role="log"
          aria-live="polite"
          data-lenis-prevent
        >
          {!answersEnabled && (
            <li className="store_chat_row store_chat_row_theirs">
              <p className="store_chat_bubble text-sm">
                {getChatWelcome(config)}
              </p>
            </li>
          )}
          {renderThread()}
        </ol>
        {!messagingEnabled ? (
          <div className="store_chat_footer">
            <p className="text-sm">{STORE_CHAT_COPY.messagingOff}</p>
            <WhatsAppLink />
          </div>
        ) : (
          <div className="store_chat_footer">
            {statusLines.map((line) => (
              <p key={line} className="text-xs thin">
                {line}
              </p>
            ))}
            {!chat.isOpen && signedIn && (
              <p className="text-xs thin">{STORE_CHAT_COPY.replyByEmail}</p>
            )}
            {needsSignIn && (
              <div className="store_chat_signin">
                <p className="text-sm">{getSignInPrompt(config)}</p>
                <Link
                  className="store_chat_team_btn text-sm"
                  href={getChatSignInHref(currentPath(pathname))}
                  onClick={onSignInClick}
                >
                  {STORE_CHAT_COPY.signIn}
                </Link>
              </div>
            )}
            {draftNotice && signedIn && (
              <div className="store_chat_draft">
                <p className="text-xs">{STORE_CHAT_COPY.draftRestored}</p>
                <button
                  type="button"
                  className="store_chat_quiet_btn text-xs"
                  onClick={onDontSend}
                >
                  {STORE_CHAT_COPY.dontSend}
                </button>
              </div>
            )}
            {errorLine && (
              <p className="store_chat_error text-xs" role="alert">
                {errorLine}
              </p>
            )}
            <form className="store_chat_form" onSubmit={onMessageSubmit}>
              <textarea
                ref={messageRef}
                className="store_chat_input store_chat_textarea text-sm"
                rows={2}
                value={message}
                maxLength={STORE_CHAT_MESSAGE_MAX_LENGTH}
                placeholder={STORE_CHAT_COPY.messagePlaceholder}
                aria-label={STORE_CHAT_COPY.messagePlaceholder}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={onMessageKeyDown}
              />
              <button
                type="submit"
                className="store_chat_send"
                aria-label="Send message"
                disabled={sending || !message.trim()}
              >
                {sending ? (
                  <span className="spinner_loader" aria-hidden="true" />
                ) : (
                  <RiSendPlane2Line size={18} aria-hidden="true" />
                )}
              </button>
            </form>
          </div>
        )}
      </>
    );
  };

  const renderBody = () => {
    if (!config) {
      return (
        <div className="store_chat_state">
          {configLoading ? (
            <p className="text-sm thin">{STORE_CHAT_COPY.loadingChat}</p>
          ) : (
            <>
              <p className="text-sm">{STORE_CHAT_COPY.unavailable}</p>
              <WhatsAppLink />
            </>
          )}
        </div>
      );
    }
    return activeView === ViewEnum.TALK ? renderTalk() : renderAnswers();
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className={`store_chat ${isOpen ? "store_chat_open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="store_chat_title"
      tabIndex={-1}
    >
      <div className="store_chat_header">
        {config && answersEnabled && activeView === ViewEnum.TALK && (
          <button
            type="button"
            className="store_chat_icon_btn"
            aria-label="Back to answers"
            onClick={() => setView(ViewEnum.ANSWERS)}
          >
            <RiArrowLeftLine size={16} aria-hidden="true" />
          </button>
        )}
        <p id="store_chat_title" className="store_chat_title bold">
          {STORE_CHAT_COPY.title}
        </p>
        {config && canTalkToUs && activeView === ViewEnum.ANSWERS && (
          <button
            type="button"
            className="store_chat_header_btn text-xs"
            onClick={() => openTalk()}
          >
            {STORE_CHAT_COPY.talkToUs}
          </button>
        )}
        <button
          type="button"
          className="store_chat_icon_btn store_chat_close"
          aria-label="Close chat"
          onClick={onClose}
        >
          <RiCloseLine size={16} aria-hidden="true" />
        </button>
      </div>
      {renderBody()}
    </div>
  );
};

export default StoreChat;
