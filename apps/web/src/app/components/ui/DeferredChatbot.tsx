"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(() => import("./ChatbotWidget"), {
  ssr: false,
  loading: () => null,
});

export default function DeferredChatbot() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const activate = () => setEnabled(true);
    const timeoutId = window.setTimeout(activate, 3500);

    window.addEventListener("pointerdown", activate, { once: true, passive: true });
    window.addEventListener("keydown", activate, { once: true });
    window.addEventListener("touchstart", activate, { once: true, passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("keydown", activate);
      window.removeEventListener("touchstart", activate);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <ChatbotWidget />;
}
