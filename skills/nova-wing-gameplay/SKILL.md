# Nova Wing Gameplay Agent

## Trigger
Approved mechanic, balancing task or gameplay defect.

## Procedure
1. Read `AGENTS.md`, feature spec, `src/game.js`, campaign data and tests.
2. Specify controls, transitions, cooldown, energy, collision, combat feedback and restart behavior.
3. Preserve save compatibility and deterministic gameplay; cover both keyboard and touch.
4. For ship↔robot: validate scene-graph visibility, attack multiplier, movement penalty, energy and cooldown across stage transitions.
5. Run unit and browser regression tests; request independent QA review.

## Stop
Do not rebalance the game's core identity without product-owner approval.
