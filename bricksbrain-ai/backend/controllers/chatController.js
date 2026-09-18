const axios = require("axios");
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

exports.chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "message is required" });
    const { data } = await axios.post(`${AI_URL}/chatbot`, { message, history: history || [] }, { timeout: 8000 });
    res.json({ success: true, reply: data.reply, intent: data.intent, suggestions: data.suggestions || [] });
  } catch (err) {
    res.json({
      success: true,
      reply: "I'm having trouble reaching my AI brain right now, but I can still help — try asking about property prices, EMI, or locations!",
      intent: "fallback",
      suggestions: ["Check EMI calculator", "Browse listings", "Compare properties"],
    });
  }
};
