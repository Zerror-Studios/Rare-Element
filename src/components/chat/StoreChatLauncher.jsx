"use client";

/**
 * The floating CHAT button (backend PRD-049 B0 and B0.1).
 *
 * The pill (`.whatsapp_chat`, its GSAP entrance in `Layout.jsx`) stays
 * put; what it does follows the store's chat config (`getChatLauncherMode`):
 * - the store's answers or messages are on → it opens the store chat
 *   panel (`StoreChat`, loaded with `next/dynamic` only when first
 *   opened, then kept mounted so closing is instant);
 * - otherwise, and while the config loads or can't be read → the
 *   WhatsApp link it always was.
 *
 * `?chat=open` (the store's reply email, coming back from signing in)
 * opens the panel on any page; the kit removes it from the address.
 */

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStoreChatConfig } from "@zcom/storefront-kit/client";
import { takeStoreChatOpenRequest } from "@zcom/storefront-kit/core";
import {
  ChatLauncherModeEnum,
  getChatLauncherMode,
  WHATSAPP_CHAT_URL,
} from "@/utils/store-chat";

// ─── Lazy panel ───────────────────────────────────────────────────────────

const StoreChat = dynamic(() => import("@/components/chat/StoreChat"), {
  ssr: false,
});

// ─── Component ────────────────────────────────────────────────────────────

const StoreChatLauncher = () => {
  const pathname = usePathname();
  const { config } = useStoreChatConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mode = getChatLauncherMode(config);

  const openChat = useCallback(() => {
    setMounted(true);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);

  // `?chat=open` opens the chat (the reply email, back from signing in)
  useEffect(() => {
    if (takeStoreChatOpenRequest()) openChat();
  }, [pathname, openChat]);

  const icon = (
    <>
      <div className="whatsapp_chat_img center">
        <Image
          height={5}
          width={5}
          className="cover"
          src="/gifs/whatsapp.gif"
          alt=""
        />
      </div>
      <p className="bold">CHAT</p>
    </>
  );

  return (
    <>
      <div className="whatsapp_chat">
        {mode === ChatLauncherModeEnum.PANEL ? (
          <button
            type="button"
            className="whatsapp_chat_link"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onClick={() => (isOpen ? closeChat() : openChat())}
          >
            {icon}
          </button>
        ) : (
          <a
            className="whatsapp_chat_link"
            href={WHATSAPP_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp (opens in a new tab)"
          >
            {icon}
          </a>
        )}
      </div>
      {mounted && <StoreChat isOpen={isOpen} onClose={closeChat} />}
    </>
  );
};

export default StoreChatLauncher;
