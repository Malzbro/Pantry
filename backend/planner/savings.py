"""Rebased savings baselines.

The old savings headline compared a plan's cost against the user's own budget,
which is circular — the user set the budget, so "saved £X vs budget" only says
"I picked a budget bigger than the plan". This module supplies *harder*, external
baselines to compare against, in descending order of credibility:

1. Personal: the user's own average recorded actual shop (once they have history).
2. ONS: the official UK average for a household of their size (week-one fallback,
   before any personal history exists).

ONS anchor
----------
£32.30 per person per week on *household food and non-alcoholic drinks*
(i.e. groceries, excluding alcohol and eating out — the right comparator for a
meal planner), UK financial year ending March 2024.

Source: ONS Family Spending in the UK / Defra Family Food FYE 2024.
https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/expenditure/bulletins/familyspendingintheuk/april2023tomarch2024

Kept as a transparent per-person figure scaled by household size rather than a
made-up per-household table: every component is officially published and the
arithmetic is visible, which is what ASA/CAP substantiation for savings claims
requires. Larger households enjoy some economies of scale this ignores, so the
ONS baseline is deliberately conservative for them — and it is only a fallback,
superseded by the personal baseline as soon as one real shop is recorded.
"""

# ONS/Defra, household food & non-alcoholic drinks, per person per week, FYE 2024.
ONS_WEEKLY_FOOD_PER_PERSON_GBP = 32.30
ONS_SOURCE = "ONS Family Spending / Defra Family Food, FYE 2024"


def ons_weekly_baseline_gbp(household_size: int) -> float:
    """UK-average weekly grocery spend for a household of this size."""
    size = max(1, household_size)
    return round(ONS_WEEKLY_FOOD_PER_PERSON_GBP * size, 2)
