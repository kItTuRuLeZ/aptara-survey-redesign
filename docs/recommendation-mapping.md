# How results are chosen

The result is assembled from the content workbook (`content/aptara-survey-content.xlsx`, built into
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
| Priority 2 | Q6 | Merged into priority 1 when it has the same action (see below). |
| Priority 3 | Q1 | The process guidance for the stage. Merged into an earlier card with the same action. |
| Your delivery mix | Q3, then Q2 (and Q6) | Q3 states the method mix (MULTI names every selection). One rule then adds a sentence for the main challenge, specific to a method where that matters. |
| Your team and capacity | Q4 and Q5 together | One rule per team size and sourcing pair writes the whole paragraph. The Q4 blocks are only a fallback. |
| Next 30 days | Q2 | |
| Next 90 days | Q6 | |

Maturity is never inferred from team size, sourcing or delivery methods.

## Merging priorities by action

Each priority block has an **Action** tag (Result Blocks tab) naming its
central action. Cards are considered in sheet order: challenge (Q2), then
goal (Q6), then stage (Q1). When a card's action has already been shown, the
card is dropped and its section's **Merge note** (Sections tab) is added to
the earlier card's reason, so the visitor still sees why it fits both
answers. The challenge therefore always leads; there is no padding to three
cards.

| Action | Blocks |
| --- | --- |
| content-upkeep | challenge A (Modernize priority content) |
| impact-measurement | challenge E (Connect learning to business measures), goal E (Demonstrate business impact) |
| intake-prioritization | challenge B (Protect team capacity), stage A (Agree a simple intake process) |
| learner-application | challenge C (Make learning easier to apply), goal D (Strengthen engagement and application) |
| portfolio-focus | stage C (Focus effort where it counts) |
| quality-governance | challenge D (Set shared quality standards), goal C (Raise quality and consistency) |
| reusable-production | goal B (Shorten development and update time) |
| scale-evidence | stage D (Scale what the evidence supports) |
| standard-process | stage B (Standardize what already works) |
| workflow-bottlenecks | goal A (Increase delivery capacity) |

Merge notes: goal, "It also supports the business goal you chose for the next 6–12 months."; stage,
"It also fits the stage you described ({Q1})."

Cards may share an outcome while staying separate when their actions differ,
for example "Protect team capacity" (one prioritized backlog) and "Increase
delivery capacity" (remove workflow bottlenecks).

## Combination rules

| Rule | When | Section | Mode | Priority |
| --- | --- | --- | --- | --- |
| R01 | Q4=A AND Q5=A | team | Replace | 10 |
| R02 | Q4=A AND Q5=B | team | Replace | 10 |
| R03 | Q4=A AND Q5=C | team | Replace | 10 |
| R04 | Q4=B AND Q5=A | team | Replace | 10 |
| R05 | Q4=B AND Q5=B | team | Replace | 10 |
| R06 | Q4=B AND Q5=C | team | Replace | 10 |
| R07 | Q4=C AND Q5=A | team | Replace | 10 |
| R08 | Q4=C AND Q5=B | team | Replace | 10 |
| R09 | Q4=C AND Q5=C | team | Replace | 10 |
| R10 | Q4=D AND Q5=A | team | Replace | 10 |
| R11 | Q4=D AND Q5=B | team | Replace | 10 |
| R12 | Q4=D AND Q5=C | team | Replace | 10 |
| R13 | Q2=A | delivery | Add after | 10 |
| R14 | Q2=B | delivery | Add after | 10 |
| R15 | Q2=C | delivery | Add after | 10 |
| R16 | Q2=D | delivery | Add after | 10 |
| R17 | Q2=E | delivery | Add after | 10 |
| R18 | Q2=E AND Q3=C | delivery | Add after | 30 |
| R19 | Q2=A AND Q3=C | delivery | Add after | 30 |
| R20 | Q2=A AND Q3=E | delivery | Add after | 20 |
| R21 | Q2=C AND Q3=A | delivery | Add after | 30 |
| R22 | Q2=C AND Q3=B | delivery | Add after | 30 |
| R23 | Q2=C AND Q3=D | delivery | Add after | 20 |
| R24 | Q2=B AND Q3=A | delivery | Add after | 30 |
| R25 | Q2=B AND Q3=B | delivery | Add after | 30 |
| R26 | Q2=B AND Q6=B | delivery | Add after | 20 |
| R27 | Q1=D AND Q6=E | priority_goal | Replace | 10 |
| R28 | Q1=A AND Q6=E | next90 | Add before | 0 |
| R29 | Q1=A AND Q6=A | next90 | Add after | 0 |

R01–R12 write the team paragraph for each team size and sourcing pair.
R13–R17 add the challenge sentence to the delivery mix. R18–R26 are
method-specific versions that outrank it (for example, impact + eLearning
gets measurement advice, not module upkeep). R27–R29 adjust priority 2 and
the 90-day action for Optimizing and Foundational stages. The workbook's
"Why this rule exists" column explains each one.

For a multi-select question, a condition such as `Q3=C` matches when C is
among the selections.

## Tie-breaking and fallback

- **Remove** beats everything for its section.
- For each mode (Replace, Add before, Add after), only the matching rule with
  the highest Priority applies; on a tie, the higher row in the sheet wins.
  Replace keeps the block's heading and "why" unless the rule supplies its own.
- There is no silent fallback. The build refuses to publish if any answer
  lacks a required block (including MULTI for Q3), if a placeholder names an
  unknown question, if a rule names an unknown answer, or if an Action tag
  isn't lowercase words joined by hyphens.

## Checks

`src/lib/composeResult.test.ts` composes all 37,200 combinations: every
maturity, challenge, team, sourcing and goal, crossed with every non-empty
subset of delivery methods. It checks that:

- no required section is missing;
- no placeholder or "undefined" is left in the text, and no implementation wording ("listed once", "rule", "fallback");
- there are two or three priorities, each with a heading, a reason and a different action;
- the title names priority 1;
- every selected delivery method is named when several are chosen.

It also checks that every team size and sourcing pair gets its own team
paragraph, and covers the named scenarios and the three regression profiles
from the follow-up review.
