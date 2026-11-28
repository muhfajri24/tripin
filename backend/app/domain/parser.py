"""Bounded, free Indonesian rule parser. Missing information is not invented."""

import re
from datetime import date


def parse_brief(text: str):
    q = text.casefold()
    fields = {}
    ambiguities = []
    destination = re.search(
        r"\b(?:ke|di|menuju)\s+([a-zà-ÿ][a-zà-ÿ\s-]{1,60}?)"
        r"(?=\s+(?:selama|untuk|bersama|dengan|sama|budget|anggaran|biaya|"
        r"kuliner|wisata|alam|budaya|pantai|museum|sendiri|berdua|keluarga|"
        r"pasangan|teman|\d+\s*hari)|[,.;]|$)",
        q,
    )
    if destination:
        fields["destinationName"] = destination[1].strip().title()
    else:
        known = re.search(
            r"\b(yogyakarta|jogja|yogya|banyuwangi|bali|bandung|jakarta|"
            r"surabaya|semarang|medan|denpasar|padang|makassar|jayapura|"
            r"banjarmasin|labuan bajo|lombok|raja ampat)\b",
            q,
        )
        if known:
            fields["destinationName"] = known[1].title()
    if fields.get("destinationName", "").casefold() in {"yogyakarta", "jogja", "yogya"}:
        fields["destinationId"] = "yogyakarta"
        fields["destinationName"] = "Yogyakarta"
    fields["unsupportedDestination"] = "destinationName" not in fields
    if fields["unsupportedDestination"]:
        ambiguities.append("Tujuan belum dikenali; isi kota atau daerah di Indonesia.")
    d = re.search(r"(?<![\w-])(-?\d+)\s*hari\b", q)
    if d:
        if 1 <= int(d[1]) <= 3:
            fields["days"] = int(d[1])
        else:
            ambiguities.append("Durasi yang didukung 1–3 hari; pilih ulang pada form.")
    people = re.search(r"(?<![\w-])(-?\d+)\s*(?:orang|wisatawan|dewasa)\b", q)
    if people:
        if 1 <= int(people[1]) <= 6:
            fields["adults"] = int(people[1])
        else:
            ambiguities.append(
                "Jumlah wisatawan yang didukung 1–6 dewasa; koreksi pada form."
            )
    for pattern, companion, default_count in [
        (r"\b(?:sendiri|sendirian|solo)\b", "solo", 1),
        (r"\b(?:pasangan|pacar|istri|suami|berdua)\b", "couple", 2),
        (r"\b(?:keluarga|anak-anak)\b", "family", 4),
        (r"\b(?:teman|sahabat|bestie)\b", "friends", 4),
        (r"\b(?:rombongan|grup|group)\b", "group", 6),
    ]:
        if re.search(pattern, q):
            fields["companionId"] = companion
            fields.setdefault("adults", default_count)
            break
    if "per orang" in q or "per-orang" in q:
        fields["budgetBasis"] = "person"
    elif re.search(r"\b(?:total|rombongan|grup|group)\b", q):
        fields["budgetBasis"] = "group"
    money = re.search(
        r"(?:rp\.?\s*|budget\s*(?:rp\.?\s*)?|anggaran\s*(?:rp\.?\s*)?|biaya\s*(?:rp\.?\s*)?|habis\s*(?:rp\.?\s*)?)([\d.,]{1,18})(?![\d.,])\s*(ribu|rb|juta|jt)?",
        q,
    )
    if money:
        raw = money[1]
        unit = money[2]
        try:
            value = (
                float(raw.replace(",", "."))
                if unit and not re.search(r"[.,]\d{3}(?:[.,]|$)", raw)
                else float(raw.replace(".", "").replace(",", ""))
            )
            amount = round(
                value
                * (
                    {"ribu": 1000, "rb": 1000, "juta": 1000000, "jt": 1000000}.get(
                        unit, 1
                    )
                )
            )
            if amount > 0:
                fields["budgetAmountIdr"] = amount
            else:
                ambiguities.append(
                    "Budget harus lebih dari nol; isi ulang angka IDR pada form."
                )
        except ValueError:
            ambiguities.append("Format budget tidak dikenali; isi angka IDR pada form.")
    if "mobil" in q:
        fields["transportMode"] = "driving"
    if re.search(r"motor|jalan kaki|kereta|bus", q):
        ambiguities.append("MVP mendukung mobil/driving; konfirmasi moda melalui form.")
    fields["interests"] = list(
        dict.fromkeys(
            cat
            for word, cat in [
                ("kuliner", "food"),
                ("makan", "food"),
                ("cafe", "food"),
                ("nongkrong", "food"),
                ("budaya", "culture"),
                ("museum", "culture"),
                ("sejarah", "culture"),
                ("alam", "nature"),
                ("gunung", "nature"),
                ("air terjun", "nature"),
                ("kerajinan", "craft"),
                ("oleh-oleh", "craft"),
                ("pantai", "beach"),
                ("pulau", "beach"),
                ("petualangan", "attraction"),
                ("city light", "attraction"),
            ]
            if word in q
        )
    )
    for pattern, objective in [
        (r"\b(?:terdekat|dekat|jarak|efisien)\b", "travel_time"),
        (r"\b(?:hemat|murah|terjangkau|affordable)\b", "budget"),
        (r"\b(?:seimbang|balance)\b", "balanced"),
    ]:
        if re.search(pattern, q):
            fields["objective"] = objective
            break
    fields["periodPreferences"] = []
    for token, period in [
        ("pagi", "morning"),
        ("siang", "afternoon"),
        ("sore", "evening"),
    ]:
        m = re.search(token + r"(.*?)(?=pagi|siang|sore|malam|[,.;]|$)", q)
        if m:
            cats = [
                cat
                for word, cat in [
                    ("kuliner", "food"),
                    ("budaya", "culture"),
                    ("wisata", "attraction"),
                    ("santai", "nature"),
                ]
                if word in m[1]
            ]
            if cats:
                fields["periodPreferences"].append(
                    {"period": period, "categories": cats}
                )
    when = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", q)
    if when:
        try:
            date.fromisoformat(when[1])
            fields["startDate"] = when[1]
        except ValueError:
            ambiguities.append("Tanggal tidak valid; isi tanggal kalender pada form.")
    missing = [
        k
        for k in [
            "destinationName",
            "days",
            "adults",
            "companionId",
            "interests",
            "budgetAmountIdr",
            "budgetBasis",
            "startDate",
            "transportMode",
        ]
        if k not in fields or k == "interests" and not fields["interests"]
    ]
    if fields.get("days", 1) > 1:
        missing.append("lodging")
    return {
        "draft": fields,
        "missingFields": missing,
        "ambiguities": ambiguities,
        "parserSource": "deterministic-id-v2",
    }
