# Gameplay Agent visual policy

The browser player runtime can use an OpenAI-compatible multimodal chat-completions endpoint as its decision policy. The provider receives one screenshot plus visible page text and accessible controls. It does not receive game objects, QA fixtures, snapshots, hidden HP, enemy coordinates, or internal telemetry.

## Configuration

Set these environment variables locally. Never commit credentials:

- `GAMEPLAY_AGENT_API_URL`: full chat-completions endpoint. Remote endpoints must use HTTPS. HTTP is accepted only for localhost.
- `GAMEPLAY_AGENT_API_KEY`: provider API key.
- `GAMEPLAY_AGENT_MODEL`: a model that supports image input and JSON responses.

The endpoint must accept the OpenAI-compatible request shape: `messages[].content` with text and `image_url`, plus `response_format: { type: "json_object" }`.

## Decision contract

The model returns exactly one JSON action per observation:

- `click`: exact accessible name of a visible button.
- `key`: allowlisted browser key plus bounded duration.
- `wait`: bounded wait.
- `stop`: explicit stop reason.

The browser runtime remains the enforcement boundary. A model suggestion is not executed if it violates the runtime action allowlist. Provider output is untrusted and must never be treated as game truth.

## Important limitations

This adapter makes visual decisions possible; it does not prove that a model can complete the game. A real DEV/preview session is still required to assess whether it understands the menu, learns controls, survives gameplay, and adapts to what happens. Record the exact model, endpoint class, build SHA, profile, and session artifacts when running evaluations.

Do not run this against production for exploratory play. Start with DEV or an isolated PR preview.
