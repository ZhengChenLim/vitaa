from typing import List, Dict, Any, Optional
import random, secrets

ALLOWED_DURATIONS = [30, 45, 60, 90]
DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

# ✅ Accessible categories
ACCESSIBLE_WHITELIST = [
    "walk", "jog", "run", "bicycl", "cycle", "elliptical", "stair", "step",
    "row", "rowing machine", "aerobic", "cardio",
    "resistance", "strength", "body weight", "bodyweight", "calisthenics",
    "circuit", "kettlebell", "weight training",
    "yoga", "pilates", "stretch",
    "swim", "water aerobics",
    "dance", "zumba",
    "hike", "brisk walk",
    "household", "cleaning", "mopping", "gardening"
]

# ❌ Inaccessible activities
INACCESSIBLE_DENYLIST = [
    "ski", "snowboard", "ice hockey", "skateboard", "skating, speed", "ice skating",
    "horse", "equestrian", "auto racing", "open wheel", "motocross",
    "parachute", "skydiv", "hang glid", "bungee",
    "mountain climbing", "rock climbing", "bouldering",
    "whitewater", "surfing big wave",
    "boxing, competition", "mma", "sparring", "wrestling, competition",
    "scuba", "free-diving",
    "water polo, competitive", "polo", "bobsled", "luge", "rodeo",
    "unicycling", "wheelchair", "baby carrier"
]

# --- helpers ---
def _nearest_allowed_duration(target_min: int) -> int:
    t = max(30, min(90, int(target_min)))
    return min(ALLOWED_DURATIONS, key=lambda x: abs(x - t))

def _goal_targets(goal: str):
    g = (goal or "").lower()
    if g in {"weight loss", "fat loss", "lose weight"}:
        return {"weekly_min": (300, 450), "resistance_days": 1}
    if g in {"muscle gain", "build muscle", "hypertrophy"}:
        return {"weekly_min": (90, 150), "resistance_days": 3}
    return {"weekly_min": (150, 300), "resistance_days": 1}  # maintain health

def _filter_accessible(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove inaccessible activities, keep only common ones."""
    kept = []
    for r in rows:
        name = (r.get("activity_description") or "").lower()
        major = (r.get("major_heading") or "").lower()
        if not name.strip():
            continue
        if any(bad in name or bad in major for bad in INACCESSIBLE_DENYLIST):
            continue
        if not any(ok in name or ok in major for ok in ACCESSIBLE_WHITELIST):
            continue
        kept.append(r)
    return kept

def _priority_score(activity_name: str, met: float, goal: str) -> float:
    """Score activity relevance based on goal."""
    name = (activity_name or "").lower()
    g = (goal or "").lower()
    score = min(float(met), 10.0)
    if met > 12: score -= 2.0
    if g in {"weight loss","fat loss","lose weight"}:
        if 3.5 <= met <= 10: score += 2.0
        if "walk" in name: score += 2.0
        if any(k in name for k in ["cycle","bicycl","swim"]): score += 1.2
    elif g in {"muscle gain","build muscle","hypertrophy"}:
        if any(k in name for k in ["weight","resistance","circuit","calisthenics","body weight","bodyweight","strength"]):
            score += 3.0
        if "yoga" in name or "pilates" in name: score += 1.0
        if "run" in name and met > 10: score -= 1.0
    else:
        if 3 <= met <= 6: score += 2.0
        if "walk" in name: score += 2.0
        if any(k in name for k in ["cycle","swim","yoga"]): score += 1.0
    return score

def _boost_favorites(score: float, name: str, favorites: List[str]) -> float:
    n = (name or "").lower()
    for f in favorites or []:
        term = (f or "").lower().strip()
        if term and term in n:
            score += 2.0
    return score

# --- main function ---
def make_week_plan_from_queryset(
    activities: List[Dict[str, Any]],
    goal: str,
    favorites: Optional[List[str]] = None,
    seed: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Returns a list of 7 dicts:
    [{ "day": "Monday", "recommendation": <activity name or "Rest">, "duration": <int> }, ...]
    """

    # 🎲 Randomness: if no seed, pick a new one each time
    if seed is None:
        seed = secrets.randbits(32)
    rng = random.Random(seed)

    tgt = _goal_targets(goal)
    lo, hi = tgt["weekly_min"]
    weekly_min = (lo + hi) // 2
    active_days = 6 if (tgt["resistance_days"] >= 3 or weekly_min >= 300) else 5
    rest_days = 7 - active_days

    # 1) Filter activities
    rows = _filter_accessible(activities)

    # 2) Deduplicate by name, keep highest MET
    by_name = {}
    for r in rows:
        name = (r.get("activity_description") or "").strip()
        met = float(r.get("met_value") or 0)
        if name == "" or met <= 0:
            continue
        if name not in by_name or met > by_name[name]["met"]:
            by_name[name] = {"name": name, "met": met}

    # 3) Score + favorites boost
    pool = []
    for name, data in by_name.items():
        s = _priority_score(name, data["met"], goal)
        s = _boost_favorites(s, name, favorites or [])
        pool.append({"name": name, "met": data["met"], "priority": s})

    if not pool:
        return [{"day": d, "recommendation": "Rest", "duration": 0} for d in DAY_NAMES]

    pool.sort(key=lambda x: x["priority"], reverse=True)
    pool = pool[:200]

    # 4) Minutes per day (randomized wiggle, snapped to allowed values)
    per_day = weekly_min / max(1, active_days)
    daily_minutes = [_nearest_allowed_duration(int(per_day * (0.85 + 0.30 * rng.random())))
                     for _ in range(active_days)]

    # 5) Assemble week
    used_recent = []
    plan = []
    for i in range(7):
        if i < active_days:
            # weighted random choice
            candidates = [p for p in pool if p["name"].lower() not in used_recent[-3:]] or pool
            total_w = sum(max(0.1, c["priority"]) for c in candidates)
            r = rng.random() * total_w
            acc, picked = 0.0, candidates[-1]
            for c in candidates:
                acc += max(0.1, c["priority"])
                if acc >= r:
                    picked = c; break
            used_recent.append(picked["name"].lower())
            plan.append({
                "day": DAY_NAMES[i],
                "recommendation": picked["name"],
                "duration": int(daily_minutes[i])
            })
        else:
            plan.append({"day": DAY_NAMES[i], "recommendation": "Rest", "duration": 0})

    # 6) Ensure at least one mid-week rest
    if rest_days >= 1 and all(plan[j]["recommendation"] != "Rest" for j in (2,3)):
        rest_idx = next((k for k in range(6, -1, -1) if plan[k]["recommendation"] == "Rest"), None)
        if rest_idx is not None:
            th = DAY_NAMES.index("Thursday")
            plan[rest_idx], plan[th] = plan[th], plan[rest_idx]

    return plan
