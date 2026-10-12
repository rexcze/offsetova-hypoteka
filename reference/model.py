"""Reference model of the offset mortgage comparison.

Executable form of docs/specifikace.md. The TypeScript engine must reproduce
its results (reference/golden.json) to within 0.01 CZK. If the model and the
specification disagree, fix both in the same commit and regenerate the golden file:

    python3 reference/model.py > reference/golden.json
"""

import json
import math
import sys

EPS = 1e-6
SCENARIOS = ("A", "B", "C", "D")


def annuity(principal, annual_rate, months):
    if principal <= 0 or months <= 0:
        return 0.0
    i = annual_rate / 12
    if i == 0:
        return principal / months
    return principal * i / (1 - (1 + i) ** -months)


def savings_interest_gross(amount, accounts, current_rate):
    """Monthly gross interest when `amount` is split greedily across tier slots, best rate first."""
    if amount <= 0:
        return 0.0
    slots = []
    for account in accounts:
        prev = 0.0
        for tier in account["tiers"]:
            up_to = tier["upTo"]
            slots.append((tier["rate"], None if up_to is None else up_to - prev))
            if up_to is None:
                break
            prev = up_to
    slots.append((current_rate, None))
    slots.sort(key=lambda s: -s[0])
    rest = amount
    interest = 0.0
    for rate, capacity in slots:
        if rest <= 0:
            break
        part = rest if capacity is None else min(rest, capacity)
        interest += part * rate / 12
        rest -= part
    return interest


def simulate(inp):
    loan, off, sav, pre, tax = inp["loan"], inp["offset"], inp["savings"], inp["prepayment"], inp["tax"]
    P = loan["principal"]
    n = loan["termYears"] * 12
    F = loan["fixationYears"] * 12
    H = inp["horizonYears"] * 12
    rc, ro = loan["classicRate"], loan["offsetRate"]
    surcharge = ro - rc
    accounts = sav["accounts"]
    cur_rate = sav["currentAccountRate"]

    def new_state(sid):
        return {
            "id": sid, "debt": P, "liquid": sav["initial"], "rate": ro if sid == "B" else rc,
            "yearInterest": 0.0, "interestPaid": 0.0, "taxRefund": 0.0, "savingsInterestNet": 0.0,
            "prepaymentFees": 0.0, "payoffMonth": None, "offsetSaturatedMonth": None,
            "negativeLiquidMonth": None, "rows": [],
        }

    states = {sid: new_state(sid) for sid in SCENARIOS}

    # Scenario D: savings above the reserve reduce the loan up front (borrow less), no fee.
    d = states["D"]
    if pre["initial"]:
        a0 = min(P, max(0.0, sav["initial"] - pre["reserve"]))
        d["debt"] -= a0
        d["liquid"] -= a0
        if d["debt"] <= EPS:
            d["debt"] = 0.0
            d["payoffMonth"] = 0

    for s in states.values():
        s["annuity"] = annuity(s["debt"], s["rate"], n)

    active = [s["annuity"] for s in states.values() if s["debt"] > 0]
    budget_base = max(active) if active else 0.0
    budgets = []

    for m in range(1, H + 1):
        # Refixation at the start of the first month after the fixation.
        if m == F + 1 and F < n:
            new_rc = rc if loan["rateAfterFixation"] is None else loan["rateAfterFixation"]
            for s in states.values():
                s["rate"] = new_rc + surcharge if s["id"] == "B" else new_rc
                if s["debt"] > 0:
                    s["annuity"] = annuity(s["debt"], s["rate"], n - F)
            active = [s["annuity"] for s in states.values() if s["debt"] > 0]
            if active:
                budget_base = max(active)

        deposit = sav["monthlyDeposit"] * (1 + sav["depositGrowth"]) ** ((m - 1) // 12)
        budget = budget_base + deposit
        budgets.append(budget)

        for s in states.values():
            sid = s["id"]
            debt0, liquid0 = s["debt"], s["liquid"]

            counted = 0.0
            if sid == "B" and debt0 > 0 and liquid0 > 0:
                cap_eff = debt0 if off["cap"] is None else min(off["cap"], debt0)
                counted = min(liquid0, cap_eff)
                if liquid0 > cap_eff + EPS and s["offsetSaturatedMonth"] is None:
                    s["offsetSaturatedMonth"] = m

            interest = principal = 0.0
            if debt0 > 0:
                interest = (debt0 - counted) * s["rate"] / 12
                if sid == "B" and off["mode"] == "lowerPayment":
                    scheduled = s["annuity"] - debt0 * s["rate"] / 12
                else:
                    scheduled = s["annuity"] - interest
                principal = min(debt0, scheduled)
                if debt0 - principal <= EPS:
                    principal = debt0
                    s["payoffMonth"] = m
                s["debt"] = debt0 - principal
            payment = interest + principal

            pool = liquid0 - counted
            if sid == "A":
                gross = max(0.0, pool) * cur_rate / 12
            else:
                gross = savings_interest_gross(pool, accounts, cur_rate)
            net = gross * (1 - tax["savingsInterestTax"])

            s["liquid"] = liquid0 + budget - payment + net
            s["yearInterest"] += interest
            s["interestPaid"] += interest
            s["savingsInterestNet"] += net

            refund = prepay = fee = 0.0
            if m % 12 == 0:
                if tax["deductMortgageInterest"]:
                    refund = min(s["yearInterest"], tax["deductionCap"]) * tax["incomeTaxRate"]
                s["yearInterest"] = 0.0
                s["liquid"] += refund
                s["taxRefund"] += refund

            if sid == "D" and s["debt"] > 0 and pre["annual"]:
                at_fixation_end = m == F and F < n
                if at_fixation_end or m % 12 == 0:
                    avail = s["liquid"] - pre["reserve"]
                    if avail > 0:
                        if at_fixation_end:
                            prepay = min(avail, s["debt"])
                        else:
                            free = pre["freeAnnualShare"] * P
                            x = avail if avail <= free else free + (avail - free) / (1 + pre["feeRate"])
                            prepay = min(x, s["debt"])
                            fee = pre["feeRate"] * max(0.0, prepay - free)
                        s["debt"] -= prepay
                        s["liquid"] -= prepay + fee
                        s["prepaymentFees"] += fee
                        if s["debt"] <= EPS:
                            s["debt"] = 0.0
                            s["payoffMonth"] = m
                        elif pre["mode"] == "lowerPayment":
                            s["annuity"] = annuity(s["debt"], s["rate"], n - m)

            if s["liquid"] < -0.005 and s["negativeLiquidMonth"] is None:
                s["negativeLiquidMonth"] = m

            s["rows"].append({
                "month": m, "budget": budget, "payment": payment, "interest": interest,
                "principal": principal, "prepayment": prepay, "prepaymentFee": fee,
                "savingsInterestNet": net, "taxRefund": refund, "counted": counted,
                "debt": s["debt"], "liquid": s["liquid"], "netWorth": s["liquid"] - s["debt"],
            })

    real_factor = (1 + inp["inflation"]) ** (H / 12)
    out = {"budgets": budgets, "scenarios": {}}
    for sid, s in states.items():
        nw = s["liquid"] - s["debt"]
        out["scenarios"][sid] = {
            "rows": s["rows"],
            "summary": {
                "netWorth": nw, "netWorthReal": nw / real_factor, "debt": s["debt"], "liquid": s["liquid"],
                "interestPaid": s["interestPaid"], "taxRefund": s["taxRefund"],
                "savingsInterestNet": s["savingsInterestNet"], "prepaymentFees": s["prepaymentFees"],
                "payoffMonth": s["payoffMonth"], "offsetSaturatedMonth": s["offsetSaturatedMonth"],
                "negativeLiquidMonth": s["negativeLiquidMonth"],
            },
        }
    # Rank by net worth rounded to haléře (same as JS Math.round(x * 100)); ties keep the order A, B, C, D.
    out["ranking"] = sorted(
        SCENARIOS, key=lambda sid: -math.floor(out["scenarios"][sid]["summary"]["netWorth"] * 100 + 0.5))
    return out


# ---------------------------------------------------------------- golden cases

def base_input():
    return {
        "loan": {"principal": 4_000_000, "termYears": 30, "fixationYears": 5,
                 "classicRate": 0.0489, "offsetRate": 0.0519, "rateAfterFixation": None},
        "offset": {"mode": "shortenTerm", "cap": None},
        "savings": {"initial": 300_000, "monthlyDeposit": 0, "depositGrowth": 0, "currentAccountRate": 0,
                    "accounts": [{"name": "Spořicí účet", "tiers": [{"upTo": 300_000, "rate": 0.035},
                                                                    {"upTo": None, "rate": 0.02}]}]},
        "prepayment": {"reserve": 100_000, "initial": True, "annual": True, "freeAnnualShare": 0,
                       "feeRate": 0.01, "mode": "shortenTerm"},
        "tax": {"savingsInterestTax": 0.15, "deductMortgageInterest": True, "incomeTaxRate": 0.15,
                "deductionCap": 150_000},
        "horizonYears": 5,
        "inflation": 0.025,
    }


def case(name, description, **changes):
    inp = base_input()
    for path, value in changes.items():
        target = inp
        keys = path.split("__")
        for key in keys[:-1]:
            target = target[key]
        target[keys[-1]] = value
    return {"name": name, "description": description, "input": inp}


CASES = [
    case("zaklad", "Výchozí příklad: 4 mil., fixace 5 let, úspory 300 tis., bez vkladů."),
    case("pravidelne-sporeni", "Jako základ, navíc vklad 5 000 Kč měsíčně.", savings__monthlyDeposit=5_000),
    case("refixace", "Horizont 10 let, po fixaci klasická sazba 5,5 % (offset 5,8 %), vklad 5 000 Kč rostoucí o 3 % ročně.",
         horizonYears=10, loan__rateAfterFixation=0.055, savings__monthlyDeposit=5_000, savings__depositGrowth=0.03),
    case("maly-uver-strop-offsetu", "Úvěr 1,5 mil. (úroky pod stropem odpočtu), úspory 600 tis., offset snižuje splátku a započítá max. 400 tis.",
         loan__principal=1_500_000, savings__initial=600_000, offset__mode="lowerPayment", offset__cap=400_000,
         prepayment__mode="lowerPayment", prepayment__freeAnnualShare=0.25),
    case("vice-uctu", "Dva spořicí účty s pásmy, úspory 800 tis., vklad 10 000 Kč rostoucí o 3 %, běžný účet 0,1 %.",
         savings__initial=800_000, savings__monthlyDeposit=10_000, savings__depositGrowth=0.03,
         savings__currentAccountRate=0.001,
         savings__accounts=[
             {"name": "Účet 1", "tiers": [{"upTo": 250_000, "rate": 0.04}, {"upTo": None, "rate": 0.005}]},
             {"name": "Účet 2", "tiers": [{"upTo": 100_000, "rate": 0.05}, {"upTo": 500_000, "rate": 0.03},
                                          {"upTo": None, "rate": 0.01}]},
         ]),
    case("uspory-nad-dluh", "Úvěr 1 mil., úspory 1,5 mil.: offset nese nulový úrok, scénář D splatí úvěr hned.",
         loan__principal=1_000_000, savings__initial=1_500_000),
    case("bez-dani-bez-prirazky", "Přirážka 0, spořicí sazby 0, bez daní: offset musí být aspoň tak dobrý jako klasika.",
         loan__offsetRate=0.0489, savings__accounts=[], tax__deductMortgageInterest=False,
         tax__savingsInterestTax=0, savings__monthlyDeposit=3_000),
    case("cely-uver", "Horizont 30 let, fixace 30 let: úvěr se splatí ve všech scénářích.",
         loan__fixationYears=30, horizonYears=30, savings__monthlyDeposit=2_000),
]

CHECKPOINT_MONTHS = (1, 12)


def golden():
    out = []
    for c in CASES:
        res = simulate(c["input"])
        H = c["input"]["horizonYears"] * 12
        months = sorted(set(CHECKPOINT_MONTHS + (H,)))
        expected = {
            "budgetFirst": res["budgets"][0],
            "budgetLast": res["budgets"][-1],
            "ranking": res["ranking"],
            "scenarios": {
                sid: {
                    "summary": sc["summary"],
                    "checkpoints": {str(mm): {k: sc["rows"][mm - 1][k] for k in ("debt", "liquid", "netWorth", "payment")}
                                    for mm in months},
                }
                for sid, sc in res["scenarios"].items()
            },
        }
        out.append({**c, "expected": expected})
    return {"tolerance": 0.01, "cases": out}


if __name__ == "__main__":
    json.dump(golden(), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
