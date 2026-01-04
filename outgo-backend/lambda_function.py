import json
import re
import base64
from collections import defaultdict

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€"
}

DATE_PATTERN = re.compile(r"\d{1,2}/\d{1,2}/\d{2,4}")
EXPENSE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*-\s*(.+)")


def lambda_handler(event, context):
    try:
        text = extract_text(event)
        result = analyze_expenses(text)

        return response(200, result)

    except Exception as e:
        return response(500, {"error": str(e)})


# 🔹 Handles pasted text AND file upload
def extract_text(event):
    body = event.get("body", "")

    if event.get("isBase64Encoded", False):
        decoded = base64.b64decode(body)
        return decoded.decode("utf-8")

    return body


def analyze_expenses(text):
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    months = []
    current_month = None
    current_date = None

    for line in lines:
        if "expenses" in line.lower():
            current_month = create_new_month(line)
            months.append(current_month)
            continue

        if line.lower().startswith("currency"):
            code = line.split("-")[1].strip().upper()
            current_month["currency"] = code
            current_month["currencySymbol"] = CURRENCY_SYMBOLS.get(code, "")
            continue

        if DATE_PATTERN.fullmatch(line):
            current_date = line
            current_month["dailyTotals"].setdefault(current_date, 0)
            continue

        match = EXPENSE_PATTERN.match(line)
        if match:
            amount = float(match.group(1))
            category = match.group(2)

            current_month["totalSpent"] += amount
            current_month["dailyTotals"][current_date] += amount
            current_month["categoryTotals"][category] += amount

            if category.lower() == "investment":
                current_month["totalInvestment"] += amount
            else:
                current_month["totalExpense"] += amount

            if amount > current_month["highestExpense"]["amount"]:
                current_month["highestExpense"] = {
                    "amount": amount,
                    "date": current_date,
                    "category": category
                }

    return [build_month_response(m) for m in months]


def create_new_month(name):
    return {
        "month": name,
        "currency": "INR",
        "currencySymbol": "₹",
        "totalSpent": 0,
        "totalExpense": 0,
        "totalInvestment": 0,
        "dailyTotals": {},
        "categoryTotals": defaultdict(float),
        "highestExpense": {"amount": 0, "date": "", "category": ""}
    }


def build_month_response(m):
    days = len(m["dailyTotals"])
    avg = m["totalSpent"] / days if days else 0

    top_categories = dict(
        sorted(
            ((k, v) for k, v in m["categoryTotals"].items() if k.lower() != "investment"),
            key=lambda x: x[1],
            reverse=True
        )[:3]
    )

    return {
        "month": m["month"],
        "currency": m["currency"],
        "summary": {
            "totalDays": days,
            "totalSpent": round(m["totalSpent"], 2),
            "averagePerDay": round(avg, 2),
            "totalExpense": round(m["totalExpense"], 2),
            "totalInvestment": round(m["totalInvestment"], 2)
        },
        "highestExpense": m["highestExpense"],
        "topCategories": top_categories
    }


def response(code, body):
    return {
        "statusCode": code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        "body": json.dumps(body)
    }

# Uncomment below for local testing
# if __name__ == "__main__":
#     with open("tests/test_event.json") as f:
#         event = json.load(f)

#     response = lambda_handler(event, None)
#     print(json.dumps(json.loads(response["body"]), indent=2))
