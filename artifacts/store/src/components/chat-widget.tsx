import { useState, useRef, useEffect } from "react";

const BRAND = "#9B0F5F";
const GOLD = "#D4AF37";
const WA_NUM = "919618535437";

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

type Msg = { id: string; from: "bot" | "user"; text: string; time: string };
type QR = { label: string; action: string };
type Step =
  | "main" | "categories"
  | "gift-who" | "gift-budget"
  | "lead-name" | "lead-mobile" | "lead-product" | "lead-qty" | "lead-city" | "lead-pin"
  | "track-input" | "freetext";

const GREETING = `✨ Welcome to Sriswa Studio.

Discover premium anti-tarnish jewellery crafted for everyday elegance.

How can I help you today?`;

const MAIN_QR: QR[] = [
  { label: "🛍 Shop Categories",       action: "categories"   },
  { label: "🔥 Best Sellers",          action: "best-sellers" },
  { label: "✨ New Arrivals",           action: "new-arrivals" },
  { label: "💎 Anti-Tarnish Info",     action: "anti-tarnish" },
  { label: "🎁 Suggest a Gift",        action: "gift"         },
  { label: "🚚 Track My Order",        action: "track-order"  },
  { label: "📦 Shipping Info",         action: "shipping"     },
  { label: "🔄 Returns & Exchange",    action: "returns"      },
  { label: "🛒 Place an Order",        action: "order"        },
  { label: "💬 Talk to Support",       action: "support"      },
];

const CAT_QR: QR[] = [
  { label: "⌚ Watches",      action: "cat:watches"     },
  { label: "💍 Rings",        action: "cat:rings"       },
  { label: "✨ Earrings",     action: "cat:earrings"    },
  { label: "📿 Necklaces",    action: "cat:necklaces"   },
  { label: "💖 Mangalsutras", action: "cat:mangalsutra" },
  { label: "🪄 Bracelets",    action: "cat:bracelets"   },
  { label: "🟡 Kadas",        action: "cat:kadas"       },
  { label: "🎁 Chain Sets",   action: "cat:chain-sets"  },
];

const GIFT_WHO_QR: QR[] = [
  { label: "👰 Wife",        action: "who:Wife"       },
  { label: "💕 Girlfriend",  action: "who:Girlfriend" },
  { label: "🤍 Mother",      action: "who:Mother"     },
  { label: "👯 Sister",      action: "who:Sister"     },
  { label: "🤝 Friend",      action: "who:Friend"     },
];

const GIFT_BUDGET_QR: QR[] = [
  { label: "Under ₹500",         action: "budget:under ₹500"    },
  { label: "₹500 – ₹1,000",     action: "budget:₹500–₹1,000"  },
  { label: "₹1,000 – ₹2,000",   action: "budget:₹1,000–₹2,000"},
  { label: "💎 Premium Collection", action: "budget:Premium"    },
];

const BACK_QR: QR[] = [{ label: "🏠 Main Menu", action: "main" }];

const CAT_NAMES: Record<string, string> = {
  watches: "Watches", rings: "Rings", earrings: "Earrings",
  necklaces: "Necklaces", mangalsutra: "Mangalsutras",
  bracelets: "Bracelets", kadas: "Kadas", "chain-sets": "Chain Sets",
};

function mkId() { return Date.now() + Math.random().toString(36).slice(2); }
function now()  { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

export function ChatWidget() {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [replies,     setReplies]     = useState<QR[]>([]);
  const [typing,      setTyping]      = useState(false);
  const [inputMode,   setInputMode]   = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [inputVal,    setInputVal]    = useState("");
  const [step,        setStep]        = useState<Step>("main");
  const [lead,        setLead]        = useState<Record<string, string>>({});
  const [giftWho,     setGiftWho]     = useState("");
  const [badge,       setBadge]       = useState(false);
  const bodyRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function scrollDown() {
    setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 60);
  }

  function pushMsg(from: "bot" | "user", text: string) {
    setMessages(prev => [...prev, { id: mkId(), from, text, time: now() }]);
    scrollDown();
  }

  function botSay(text: string, qr?: QR[], input?: boolean, ph = "Type here…", delay = 750) {
    setTyping(true);
    setReplies([]);
    setInputMode(false);
    setTimeout(() => {
      setTyping(false);
      pushMsg("bot", text);
      if (qr)    setReplies(qr);
      if (input) { setInputMode(true); setPlaceholder(ph); setTimeout(() => inputRef.current?.focus(), 80); }
      scrollDown();
    }, delay);
  }

  useEffect(() => {
    if (open && messages.length === 0) botSay(GREETING, MAIN_QR, false, "", 400);
    if (open) setBadge(false);
  }, [open]);

  useEffect(() => {
    if (!open) { const t = setTimeout(() => setBadge(true), 4000); return () => clearTimeout(t); }
  }, [open]);

  function pick(label: string, action: string) {
    pushMsg("user", label);
    setReplies([]);
    run(action);
  }

  function wa(msg: string, delay = 1400) {
    setTimeout(() => window.open(`https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`, "_blank"), delay);
  }

  function run(action: string) {
    if (action === "main") {
      setStep("main");
      botSay(GREETING, MAIN_QR);
      return;
    }
    if (action === "categories") {
      setStep("categories");
      botSay("Here are our jewellery collections 💎\n\nWhich one catches your eye?", CAT_QR);
      return;
    }
    if (action.startsWith("cat:")) {
      const key = action.split(":")[1];
      const name = CAT_NAMES[key] || key;
      botSay(`💎 Great choice! Connecting you for our *${name}* collection…`, BACK_QR);
      wa(`Hi Sriswa Studio! I'm interested in your ${name} collection. Can you help me?`);
      return;
    }
    if (action === "best-sellers") {
      botSay(`🔥 *Our Best Sellers*\n\n• Anti-Tarnish Gold Bracelet Set\n• Floral Stud Earrings ✨\n• Elegant Link Chain\n• Stackable Ring Set\n• Pearl Drop Earrings\n\nWant to order any of these?`, [
        { label: "🛒 Order Now", action: "order" },
        { label: "🏠 Main Menu", action: "main"  },
      ]);
      return;
    }
    if (action === "new-arrivals") {
      botSay(`✨ *New Arrivals — 2025 Collection*\n\n• Pearl Drop Earrings\n• Twisted Rope Bracelet\n• Vintage Mangalsutra\n• Bloom Ring Set\n• Lotus Chain Set\n\nShall I help you order?`, [
        { label: "🛒 Order Now", action: "order" },
        { label: "🏠 Main Menu", action: "main"  },
      ]);
      return;
    }
    if (action === "anti-tarnish") {
      botSay(`💎 *Our Anti-Tarnish Technology*\n\nDesigned for everyday wear and long-lasting shine.\n\nFor best results:\n• Avoid perfumes & harsh chemicals\n• Store in a dry place\n• Wipe with a soft cloth after use\n\n✅ 100% Waterproof\n✅ Nickel-Free & Skin-Safe\n✅ Lasts years with proper care`, [
        { label: "🛍 Shop Now",  action: "categories" },
        { label: "🏠 Main Menu", action: "main"        },
      ]);
      return;
    }
    if (action === "gift") {
      botSay(`🎁 How sweet! Who is this gift for?`, GIFT_WHO_QR);
      setStep("gift-who");
      return;
    }
    if (action.startsWith("who:")) {
      const who = action.split(":")[1];
      setGiftWho(who);
      botSay(`Lovely! 💕 What's your budget for this gift?`, GIFT_BUDGET_QR);
      setStep("gift-budget");
      return;
    }
    if (action.startsWith("budget:")) {
      const budget = action.split(":")[1];
      botSay(`Perfect! 🎁 Finding the best jewellery for your ${giftWho} — ${budget}.\n\nConnecting you with our gift specialist…`, BACK_QR);
      wa(`Hi! I'm looking for a gift for my ${giftWho}, budget ${budget}. Can you suggest jewellery?`);
      return;
    }
    if (action === "track-order") {
      setStep("track-input");
      botSay(`📦 Please share your *Order ID* and we'll check it right away!`, [], true, "Enter your Order ID…");
      return;
    }
    if (action === "shipping") {
      botSay(`🚚 *Shipping Information*\n\n• 🆓 Free shipping above ₹999\n• Standard delivery: 4–7 business days\n• Express: 1–3 business days\n• Dispatched within 24 hours\n• Delivered pan-India 🇮🇳`, [
        { label: "🔄 Returns Policy", action: "returns" },
        { label: "🏠 Main Menu",      action: "main"    },
      ]);
      return;
    }
    if (action === "returns") {
      botSay(`🔄 *Returns & Exchange Policy*\n\n• 7-day easy return or exchange\n• Item must be unused & in original packaging\n• Damaged items replaced for free\n• Refund in 3–5 business days\n\nShare your Order ID on WhatsApp to initiate.`, [
        { label: "💬 Contact Support", action: "support" },
        { label: "🏠 Main Menu",       action: "main"    },
      ]);
      return;
    }
    if (action === "support") {
      botSay(`Connecting you with our jewellery expert… 💎\n\nAvailable Mon–Sun, 9am–9pm IST.`, BACK_QR);
      wa("Hi Sriswa Studio! I need support.");
      return;
    }
    if (action === "order") {
      setStep("lead-name");
      setLead({});
      botSay(`✨ Let's place your order! I'll need a few details.\n\nFirst, what's your *Name*?`, [], true, "Your full name…");
      return;
    }
  }

  function submitInput() {
    const val = inputVal.trim();
    if (!val) return;
    setInputVal("");
    pushMsg("user", val);
    setInputMode(false);

    if (step === "lead-name") {
      setLead(p => ({ ...p, name: val }));
      setStep("lead-mobile");
      botSay(`Great, ${val.split(" ")[0]}! 😊 What's your *Mobile Number*?`, [], true, "10-digit number…");
    } else if (step === "lead-mobile") {
      setLead(p => ({ ...p, mobile: val }));
      setStep("lead-product");
      botSay(`Got it! Which *product* would you like to order?`, [], true, "Product name or description…");
    } else if (step === "lead-product") {
      setLead(p => ({ ...p, product: val }));
      setStep("lead-qty");
      botSay(`How many pieces — *Quantity*?`, [], true, "e.g. 1, 2…");
    } else if (step === "lead-qty") {
      setLead(p => ({ ...p, qty: val }));
      setStep("lead-city");
      botSay(`And your *City*?`, [], true, "Your city name…");
    } else if (step === "lead-city") {
      setLead(p => ({ ...p, city: val }));
      setStep("lead-pin");
      botSay(`Almost done! Your *PIN Code*?`, [], true, "6-digit PIN code…");
    } else if (step === "lead-pin") {
      const final = { ...lead, pin: val };
      setLead(final);
      setStep("main");
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(final),
      }).catch(() => {});
      botSay(`✅ Order request received, *${lead.name}*!\n\nOur team will call you at *${lead.mobile}* within 2 hours to confirm.\n\nThank you for choosing Sriswa Studio! 💎`, [
        { label: "💬 Chat on WhatsApp", action: "support" },
        { label: "🏠 Main Menu",        action: "main"    },
      ]);
      wa(`Hi! Order Request:\nName: ${lead.name}\nMobile: ${lead.mobile}\nProduct: ${lead.product}\nQty: ${lead.qty}\nCity: ${lead.city}\nPIN: ${val}`, 2000);
    } else if (step === "track-input") {
      setStep("main");
      botSay(`Checking your order *${val}*… Let me connect you on WhatsApp for real-time tracking. 📦`, BACK_QR);
      wa(`Hi! My Order ID is ${val}. Can you help me track it?`);
    } else {
      setStep("main");
      botSay(`I'd love to help with that!\n\nLet me connect you with our jewellery expert. 💎`, BACK_QR);
      wa(`Hi Sriswa Studio! I have a query: ${val}`);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 340, height: "min(580px, 82vh)", fontFamily: "inherit" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: BRAND }}>
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.35)" }}
              >
                SS
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Sriswa Studio</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  <span className="text-white/60 text-[11px]">Online · replies in minutes</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors leading-none text-2xl"
            >×</button>
          </div>

          {/* ── Messages ── */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
            style={{ background: "#f5eef9" }}
          >
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                {m.from === "bot" && (
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 self-end mb-1"
                    style={{ background: BRAND }}
                  >SS</div>
                )}
                <div
                  className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words"
                  style={m.from === "bot"
                    ? { background: "white", color: "#1a0a0f", borderTopLeftRadius: 4 }
                    : { background: BRAND, color: "white", borderTopRightRadius: 4 }
                  }
                >
                  {m.text}
                  <div className="text-[10px] mt-1 opacity-40 text-right">{m.time}</div>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-2">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: BRAND }}
                >SS</div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ background: BRAND, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="h-1" />
          </div>

          {/* ── Quick Replies ── */}
          {replies.length > 0 && (
            <div
              className="px-3 py-2.5 flex-shrink-0 flex flex-wrap gap-2 border-t"
              style={{ background: "#faf5fd", borderColor: "#e8d5f5" }}
            >
              {replies.map(r => (
                <button
                  key={r.action}
                  onClick={() => pick(r.label, r.action)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 hover:text-white"
                  style={{ borderColor: BRAND, color: BRAND, background: "white" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BRAND; (e.currentTarget as HTMLElement).style.color = "white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.color = BRAND; }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Text Input ── */}
          {inputMode && (
            <div
              className="px-3 py-2.5 flex gap-2 flex-shrink-0 border-t"
              style={{ background: "white", borderColor: "#e8d5f5" }}
            >
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitInput()}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 text-sm rounded-full outline-none border"
                style={{ borderColor: `${BRAND}55`, fontSize: 13 }}
              />
              <button
                onClick={submitInput}
                className="h-9 w-9 rounded-full flex items-center justify-center text-white flex-shrink-0 hover:opacity-90 transition-opacity"
                style={{ background: BRAND }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </div>
          )}

          {/* ── Footer ── */}
          <div
            className="px-3 py-1.5 text-center text-[10px] flex-shrink-0 tracking-wide"
            style={{ background: BRAND, color: "rgba(255,255,255,0.4)" }}
          >
            Sriswa Studio Assistant · +91 96185 35437
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{ background: BRAND }}
        aria-label="Chat with Sriswa Studio"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d={WA_PATH} />
          </svg>
        )}
        {badge && !open && (
          <span
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-bounce"
            style={{ background: GOLD }}
          >1</span>
        )}
      </button>
    </>
  );
}
