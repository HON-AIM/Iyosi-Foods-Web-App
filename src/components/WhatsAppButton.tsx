"use client";

import { useState } from "react";
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_MESSAGE, WHATSAPP_ICON_PATH } from "@/lib/whatsapp";

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);
  const url = buildWhatsAppUrl(DEFAULT_WHATSAPP_MESSAGE);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group"
    >
      <span
        className={`bg-white text-gray-800 text-sm font-medium px-3 py-2 rounded-lg shadow-lg
        border border-gray-100 transition-all duration-200 whitespace-nowrap
        ${hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}`}
      >
        Chat with us 💬
      </span>

      <div
        className="w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] rounded-full flex items-center
        justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d={WHATSAPP_ICON_PATH} />
        </svg>
      </div>
    </a>
  );
}
