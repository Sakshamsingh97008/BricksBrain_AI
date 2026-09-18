import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import api from "../api/axios";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm the BricksBrain AI assistant. Ask me about properties, prices, EMI, or neighborhoods." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/chat", { message: msg });
      setMessages((m) => [...m, { role: "bot", text: data.reply, suggestions: data.suggestions }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I couldn't reach the AI service. Please make sure the backend and AI service are running." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] h-[460px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center gap-2">
            <Bot size={20} />
            <div>
              <p className="font-semibold text-sm">BricksBrain Assistant</p>
              <p className="text-xs text-brand-100">AI-powered real estate help</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                  {m.text}
                  {m.suggestions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.suggestions.map((s, si) => (
                        <button key={si} onClick={() => send(s)} className="text-[11px] bg-brand-50 text-brand-600 px-2 py-1 rounded-full hover:bg-brand-100">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-gray-400">Assistant is typing...</p>}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about properties, EMI, prices..."
              className="input-field !py-2 text-sm"
            />
            <button onClick={() => send()} className="bg-brand-600 text-white rounded-lg px-3 flex items-center justify-center hover:bg-brand-700">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
