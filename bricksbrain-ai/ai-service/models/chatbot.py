"""
AI chatbot for real-estate queries.
Uses an intent-classification + slot-extraction approach (regex + keyword scoring),
which is fast, free to run, and fully self-contained (no external LLM API key needed).
To upgrade to a generative LLM, swap `generate_reply()` internals to call an LLM API
(e.g. the Anthropic API) using the extracted intent/slots as context.
"""
import re

INTENTS = {
    "greeting": ["hi", "hello", "hey", "namaste", "good morning", "good evening"],
    "price_prediction": ["price", "cost", "worth", "value", "predict", "estimate"],
    "emi": ["emi", "loan", "interest rate", "monthly installment", "down payment", "home loan"],
    "search_property": ["find", "search", "looking for", "show me", "flats", "apartment", "villa", "house for sale", "house for rent"],
    "area_info": ["area", "locality", "neighbourhood", "neighborhood", "safety", "schools", "connectivity", "infrastructure"],
    "compare": ["compare", "vs", "versus", "difference between"],
    "forecast": ["forecast", "future price", "next year", "appreciation", "investment", "growth"],
    "contact_agent": ["agent", "call", "contact", "talk to someone", "human"],
    "thanks": ["thanks", "thank you", "thnx", "great", "awesome"],
    "goodbye": ["bye", "goodbye", "see you"],
}

CITIES = ["bangalore", "mumbai", "delhi", "pune", "hyderabad", "chennai", "gurugram", "noida"]
BHK_PATTERN = re.compile(r"(\d)\s?bhk", re.IGNORECASE)
BUDGET_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s?(lakh|lac|crore|cr)", re.IGNORECASE)


def classify_intent(message: str) -> str:
    msg = message.lower()
    scores = {intent: 0 for intent in INTENTS}
    for intent, keywords in INTENTS.items():
        for kw in keywords:
            if kw in msg:
                scores[intent] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def extract_slots(message: str) -> dict:
    msg = message.lower()
    slots = {}
    city_found = [c for c in CITIES if c in msg]
    if city_found:
        slots["city"] = city_found[0].title()
    bhk_match = BHK_PATTERN.search(msg)
    if bhk_match:
        slots["bhk"] = int(bhk_match.group(1))
    budget_match = BUDGET_PATTERN.search(msg)
    if budget_match:
        amount = float(budget_match.group(1))
        unit = budget_match.group(2).lower()
        multiplier = 100000 if unit in ("lakh", "lac") else 10000000
        slots["budget"] = int(amount * multiplier)
    return slots


def generate_reply(message: str, history: list) -> dict:
    intent = classify_intent(message)
    slots = extract_slots(message)
    suggestions = []

    if intent == "greeting":
        reply = "Hi! I'm the BricksBrain AI assistant. I can help you find properties, estimate prices, calculate EMI, or explore neighborhoods. What are you looking for today?"
        suggestions = ["Find 2 BHK in Bangalore under 80 lakh", "Predict price of my property", "Calculate my home loan EMI"]

    elif intent == "price_prediction":
        city_txt = f" in {slots['city']}" if slots.get("city") else ""
        reply = f"I can estimate a property's market price{city_txt} using our ML price prediction model. Head to the 'Price Prediction' tool and enter details like area, BHK, floor, and furnishing — I'll give you an instant estimate with a confidence range."
        suggestions = ["Open price prediction tool", "What factors affect property price?"]

    elif intent == "emi":
        reply = "You can use our EMI Calculator to work out your monthly home loan installment. Just enter the loan amount, interest rate, and tenure — I'll also show you a year-by-year amortization breakdown."
        suggestions = ["Open EMI calculator", "What's a good down payment percentage?"]

    elif intent == "search_property":
        parts = []
        if slots.get("bhk"):
            parts.append(f"{slots['bhk']} BHK")
        if slots.get("city"):
            parts.append(f"in {slots['city']}")
        if slots.get("budget"):
            parts.append(f"under ₹{slots['budget']:,}")
        criteria = " ".join(parts) if parts else "properties matching your needs"
        reply = f"Searching for {criteria}. You can refine results further using filters like furnishing, area, and amenities on the Listings page."
        suggestions = ["Go to listings", "Show featured properties"]

    elif intent == "area_info":
        city_txt = slots.get("city", "your selected locality")
        reply = f"Our Area Intelligence tool covers {city_txt} with scores for walkability, safety, connectivity, nearby schools/hospitals, and 5-year price growth trends — check any property's detail page for its full area profile."
        suggestions = ["Open area intelligence", "Show safest localities"]

    elif intent == "compare":
        reply = "You can compare up to 4 properties side-by-side — price, area, amenities, EMI, and area scores — using the Compare tool. Add properties to your comparison list from any listing card."
        suggestions = ["Open compare tool"]

    elif intent == "forecast":
        city_txt = slots.get("city", "a city")
        reply = f"I can forecast future price trends for {city_txt} using ARIMA and neural network (LSTM) models trained on historical price indices — useful for gauging investment potential over 1-3 years."
        suggestions = ["Open price forecast", "Which city has best appreciation?"]

    elif intent == "contact_agent":
        reply = "I can connect you with a verified agent. Please share your name, phone number, and the property you're interested in, and our team will reach out within 24 hours."
        suggestions = ["Leave contact details"]

    elif intent == "thanks":
        reply = "You're welcome! Let me know if there's anything else about buying, selling, or renting property I can help with."

    elif intent == "goodbye":
        reply = "Goodbye! Come back anytime you want to explore properties or run a price forecast. 👋"

    else:
        reply = "I can help with property search, price prediction, EMI calculation, area intelligence, and price forecasting. Could you tell me a bit more about what you need — e.g. city, budget, or BHK?"
        suggestions = ["Find properties", "Predict a price", "Calculate EMI", "Forecast future prices"]

    return {"reply": reply, "intent": intent, "slots": slots, "suggestions": suggestions}
