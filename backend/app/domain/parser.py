"""Bounded, free Indonesian rule parser. Missing information is not invented."""

import re
from datetime import date


def parse_brief(text: str):
    q = text.casefold()
    fields = {}
    ambiguities = []
    cities = [
        x
        for x in ["bali", "bandung", "jakarta", "surabaya", "lombok", "toba", "bajo"]
        if re.search(r"\b" + x + r"\b", q)
    ]
    if re.search(r"\b(?:yogyakarta|jogja|yogya)\b", q):
        fields["destinationId"] = "yogyakarta"
    if cities:
        ambiguities.append(
            "Tujuan di luar Yogyakarta belum didukung: " + ", ".join(cities)
        )
        fields["unsupportedDestination"] = True
    if "destinationId" not in fields:
        fields["unsupportedDestination"] = True
        if not cities:
            ambiguities.append(
                "Tujuan belum dikenali; pilih Yogyakarta secara eksplisit pada form."
            )
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
    if "per orang" in q or "per-orang" in q:
        fields["budgetBasis"] = "person"
    elif re.search(r"total|rombongan|grup", q):
        fields["budgetBasis"] = "group"
    money = re.search(
        r"(?:rp\.?\s*|budget\s*(?:rp\.?\s*)?|anggaran\s*(?:rp\.?\s*)?)([\d.,]{1,18})(?![\d.,])\s*(ribu|rb|juta|jt)?",
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
                ("budaya", "culture"),
                ("museum", "culture"),
                ("alam", "nature"),
                ("kerajinan", "craft"),
            ]
            if word in q
        )
    )
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
            "destinationId",
            "days",
            "adults",
            "budgetAmountIdr",
            "budgetBasis",
            "startDate",
            "transportMode",
        ]
        if k not in fields
    ]
    if fields.get("days", 1) > 1:
        missing.append("lodging")
    return {
        "draft": fields,
        "missingFields": missing,
        "ambiguities": ambiguities,
        "parserSource": "deterministic-id-v1",
    }
