# How results are chosen

The result is assembled from the content sheet (`content/*.csv`, built into
`src/content/content.json` by `npm run content`). Nothing is generated at run
time: the same answers always give the same result. The engine is
`src/lib/composeResult.ts`.

## Inputs

| Step | Code | Question | Type | Answers (code: short label) |
| --- | --- | --- | --- | --- |
| 1 | Q1 | Maturity stage (self-reported) | Single | A Foundational, B Developing, C Established, D Optimizing |
| 2 | Q2 | Main challenge | Single | A Content upkeep, B Delivery capacity, C Learner engagement, D Consistent quality, E Demonstrating impact |
| 3 | Q3 | Delivery methods | Multi (at least one) | A In-person ILT, B Virtual ILT, C Self-paced eLearning, D Microlearning, E Reference materials |
| 4 | Q4 | Internal team | Single | A None (0), B Small (1–5), C Medium (6–15), D Large (16+) |
| 4 | Q5 | Sourcing | Single | A Mainly in-house, B Mixed, C Mainly partners |
| 5 | Q6 | Business goal | Single | A Delivery capacity, B Faster development, C Quality and consistency, D Engagement and application, E Business impact |

Q4 and Q5 are separate fields on one screen. Every combination of them is valid.

## Which answer writes which part

| Result part | Chosen by | Notes |
| --- | --- | --- |
| Title | Q2 | Names priority 1, in the same words as its heading. |
| Starting point | Q1 | Restates the self-reported stage. Not a score. |
| Priority 1 | Q2 | Heading, action and "why this matters for you". |
| Priority 2 | Q6 | Hidden when it repeats priority 1 (see deduplication). |
| Priority 3 | Q1 | The level of process and governance guidance for the stage. |
| Your delivery mix | Q3 | One method: that method's block. Several: the MULTI block, which names every selection. |
| Your team and capacity | Q4, then Q5 | Two sentences: team size, then how work is delivered. |
| Next 30 days | Q2 | |
| Next 90 days | Q6 | |

Maturity is never inferred from team size, sourcing or delivery methods.

## Deduplication

When the challenge and the goal mean the same thing, the goal priority is
removed and priority 1 says it also covers the goal:

| Challenge (Q2) | Goal (Q6) | Rules |
| --- | --- | --- |
| A Content upkeep | B Faster development | R01, R02 |
| B Delivery capacity | A Delivery capacity | R03, R04 |
| C Learner engagement | D Engagement and application | R05, R06 |
| D Consistent quality | C Quality and consistency | R07, R08 |
| E Demonstrating impact | E Business impact | R09, R10 |

The result then has two priorities instead of three.

## Combination rules

| Rule | When | Effect |
| --- | --- | --- |
| R11 | Content upkeep + eLearning selected | Adds an eLearning review step to the delivery advice. |
| R12 | Content upkeep + reference materials selected | Adds owners and review dates for documents. |
| R13 | Learner engagement + microlearning selected | Links microlearning to the task it supports. |
| R14 | Delivery capacity + in-person ILT selected | Suggests recording or supporting live sessions. |
| R15 | No dedicated team + mainly in-house | Replaces sourcing advice: learning is spread across other roles. |
| R16 | No dedicated team + mainly partners | Replaces team advice: name an internal owner who briefs partners. |
| R17 | Large team + mixed sourcing | Replaces sourcing advice: review ownership across teams and partners. |
| R18 | Optimizing + business impact goal | Replaces priority 2 text: build on an existing measure. |
| R19 | Foundational + business impact goal | Adds "start with one simple measure" to the 90-day action. |
| R20 | Foundational + delivery capacity goal | Adds "keep the process simple" to the 90-day action. |

For a multi-select question, a condition such as `Q3=C` matches when C is
among the selections.

## Tie-breaking and fallback

- **Remove** beats everything for its section.
- Of several matching **Replace** rules, the highest Priority wins. Replace
  keeps the block's heading and "why" unless the rule supplies its own.
- **Add before** and **Add after** rules stack, highest Priority first.
- There is no silent fallback. The build refuses to publish if any answer
  lacks a required block (including MULTI for Q3), if a placeholder names an
  unknown question, or if a rule names an unknown answer.

## Checks

`src/lib/composeResult.test.ts` composes all 37,200 combinations: every
maturity, challenge, team, sourcing and goal, crossed with every non-empty
subset of delivery methods. It checks that:

- no required section is missing;
- no placeholder or "undefined" is left in the text;
- there are two or three priorities, all different, each with a heading and a reason;
- the title names priority 1;
- every selected delivery method is named when several are chosen.

It also covers the named scenarios from the improvement brief.
