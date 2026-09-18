"""
Personalized property recommendation system.
Content-based filtering: builds a feature vector for the user (from preferences +
viewed/saved property attributes) and a feature vector for every candidate property,
then ranks candidates by cosine similarity. This is a lightweight, dependency-free
approach (numpy only) that works well without needing large amounts of interaction data,
which suits a cold-start-heavy real estate use case.
"""
import numpy as np


def _property_vector(p: dict, city_list, type_list):
    city_vec = [1.0 if p.get("city") == c else 0.0 for c in city_list]
    type_vec = [1.0 if p.get("propertyType") == t else 0.0 for t in type_list]
    numeric = [
        float(p.get("price", 0)) / 1e7,
        float(p.get("areaSqft", 0)) / 3000.0,
        float(p.get("bhk", 0)) / 5.0,
    ]
    return np.array(city_vec + type_vec + numeric)


def recommend(payload: dict, top_n: int = 12):
    candidates = payload.get("candidate_properties", [])
    if not candidates:
        return []

    city_list = sorted(list({c.get("city") for c in candidates if c.get("city")}))
    type_list = sorted(list({c.get("propertyType") for c in candidates if c.get("propertyType")}))

    prefs = payload.get("user_preferences", {}) or {}
    budget_min = prefs.get("budgetMin", 0)
    budget_max = prefs.get("budgetMax", 20000000)
    preferred_cities = prefs.get("preferredCities", []) or []
    preferred_bhk = prefs.get("bhk", []) or []

    viewed_ids = set(payload.get("viewed_property_ids", []) or [])
    saved_ids = set(payload.get("saved_property_ids", []) or [])
    interacted = [c for c in candidates if c["id"] in viewed_ids or c["id"] in saved_ids]

    # Build a "user profile vector" — average of interacted properties, or synthesized
    # from stated preferences if the user has no interaction history yet (cold start).
    if interacted:
        user_vec = np.mean([_property_vector(p, city_list, type_list) for p in interacted], axis=0)
    else:
        pseudo_property = {
            "city": preferred_cities[0] if preferred_cities else (city_list[0] if city_list else None),
            "propertyType": type_list[0] if type_list else None,
            "price": (budget_min + budget_max) / 2,
            "areaSqft": (preferred_bhk[0] if preferred_bhk else 2) * 500,
            "bhk": preferred_bhk[0] if preferred_bhk else 2,
        }
        user_vec = _property_vector(pseudo_property, city_list, type_list)

    scored = []
    for c in candidates:
        if c["id"] in viewed_ids and c["id"] in saved_ids:
            continue  # already fully engaged with, skip re-recommending
        vec = _property_vector(c, city_list, type_list)
        denom = (np.linalg.norm(user_vec) * np.linalg.norm(vec)) or 1e-9
        sim = float(np.dot(user_vec, vec) / denom)

        # Budget & preference boosts
        in_budget = budget_min <= c.get("price", 0) <= budget_max
        city_match = c.get("city") in preferred_cities if preferred_cities else True
        bhk_match = c.get("bhk") in preferred_bhk if preferred_bhk else True
        boost = (0.15 if in_budget else -0.1) + (0.1 if city_match else 0) + (0.05 if bhk_match else 0)

        scored.append((c["id"], sim + boost))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [pid for pid, _ in scored[:top_n]]
