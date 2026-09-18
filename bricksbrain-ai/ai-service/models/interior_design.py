"""
AI interior design suggestions.

If OPENAI_API_KEY is set in the environment, real AI-generated design images are
requested from OpenAI's image generation API for the chosen room + style.

If no key is configured, a curated fallback is returned instead: a small set of
hand-picked reference photos per style plus written design tips, generated
instantly and requiring no API key. This is the same "graceful fallback" pattern
used elsewhere in BricksBrain (e.g. the LSTM forecaster, the Google Maps embed).
"""
import os
import base64
import requests

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations"

STYLE_TIPS = {
    "Modern": [
        "Stick to a neutral base palette (white, grey, beige) with one bold accent wall.",
        "Choose furniture with clean lines and minimal ornamentation.",
        "Use hidden/integrated storage to keep surfaces clutter-free.",
        "Layer lighting: ambient ceiling lights + a statement pendant + task lamps.",
    ],
    "Minimalist": [
        "Keep only what you use daily — every piece should earn its place.",
        "Limit the palette to 2-3 colours across the whole room.",
        "Favour open floor space over wall-to-wall furniture.",
        "Let natural light do the work; use sheer curtains instead of heavy drapes.",
    ],
    "Traditional Indian": [
        "Use warm wood tones (teak/sheesham) for furniture and flooring accents.",
        "Bring in jewel tones — maroon, mustard, emerald — through cushions and drapes.",
        "Add brass or copper decor pieces and traditional jaali (lattice) screens.",
        "A hand-block-printed or block-carved centre table adds authentic character.",
    ],
    "Scandinavian": [
        "Light wood furniture (oak, pine) paired with white or pale grey walls.",
        "Cosy textiles — chunky knit throws, sheepskin rugs — for warmth.",
        "Keep decor sparse: a few plants and one piece of statement art.",
        "Maximise daylight; avoid heavy curtains and dark colour blocking.",
    ],
    "Industrial": [
        "Exposed brick, concrete, or textured wallpaper mimicking raw finishes.",
        "Black metal fixtures — pendant lights, shelving brackets, window frames.",
        "Leather and reclaimed wood furniture for an aged, lived-in feel.",
        "Keep ductwork/piping visible rather than boxed in, if structurally possible.",
    ],
    "Luxury": [
        "Invest in a statement chandelier or layered cove lighting.",
        "Use marble or marble-finish surfaces for tables and flooring accents.",
        "Rich fabrics — velvet upholstery, silk curtains — elevate the feel instantly.",
        "Keep the colour palette restrained (2 tones + metallics) so it reads elegant, not busy.",
    ],
}

# Curated, style-appropriate stock photography used only when no image-gen API key
# is configured, so the feature still works out of the box.
FALLBACK_IMAGES = {
    "Modern": [
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&h=600&q=85",
    ],
    "Minimalist": [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&h=600&q=85",
    ],
    "Traditional Indian": [
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&h=600&q=85",
    ],
    "Scandinavian": [
        "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=800&h=600&q=85",
    ],
    "Industrial": [
        "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&h=600&q=85",
    ],
    "Luxury": [
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&h=600&q=85",
        "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=800&h=600&q=85",
    ],
}


def _build_prompt(room_type: str, style: str, notes: str) -> str:
    prompt = (
        f"A photorealistic interior design photograph of a {style.lower()} style {room_type.lower()}, "
        f"tastefully furnished and decorated, natural lighting, high detail, magazine quality."
    )
    if notes:
        prompt += f" Additional requirements: {notes}."
    return prompt


def _generate_with_openai(room_type: str, style: str, notes: str, n: int = 3):
    prompt = _build_prompt(room_type, style, notes)
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": "gpt-image-1", "prompt": prompt, "n": n, "size": "1024x1024"}
    resp = requests.post(OPENAI_IMAGE_URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    images = []
    for item in data.get("data", []):
        if item.get("url"):
            images.append(item["url"])
        elif item.get("b64_json"):
            images.append(f"data:image/png;base64,{item['b64_json']}")
    return images


def generate_interior_design(room_type: str, style: str, notes: str = "") -> dict:
    style = style if style in STYLE_TIPS else "Modern"
    tips = STYLE_TIPS[style]

    if OPENAI_API_KEY:
        try:
            images = _generate_with_openai(room_type, style, notes)
            if images:
                return {
                    "mode": "ai_generated",
                    "room_type": room_type,
                    "style": style,
                    "images": images,
                    "tips": tips,
                    "note": "Images generated by AI based on your room type and style.",
                }
        except Exception as e:  # fall through to curated fallback on any API error
            fallback_note = f"AI image generation failed ({e}); showing curated inspiration instead."
        else:
            fallback_note = "AI image generation returned no results; showing curated inspiration instead."
    else:
        fallback_note = (
            "AI image generation isn't configured (no OPENAI_API_KEY set), so here's a "
            "curated inspiration gallery and design tips for this style instead."
        )

    return {
        "mode": "curated_fallback",
        "room_type": room_type,
        "style": style,
        "images": FALLBACK_IMAGES.get(style, FALLBACK_IMAGES["Modern"]),
        "tips": tips,
        "note": fallback_note,
    }
