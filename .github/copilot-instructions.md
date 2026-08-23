# Copilot Instructions

Guidance for how GitHub Copilot should behave when working in this repository.

## Behavior Guidelines

### 1. Think Before Coding

**Do not assume. Do not hide confusion. Put trade-offs on the table.**

Before implementing:

- State your assumptions explicitly. If unsure, ask.
- If multiple interpretations exist, present them all — do not silently pick one.
- If a simpler approach exists, say so. Raise objections where reasonable.
- If anything is unclear, stop. Point out what is confusing, then ask.

### 2. Simplicity First

**The minimum code needed to solve the problem. No speculative code.**

- Do not implement more than requested.
- Do not create abstractions for code used only once.
- Do not add unrequested "flexibility" or "configurability".
- Do not write error handling for scenarios that cannot happen.
- If you wrote 200 lines that could have been 50, rewrite it.

Ask yourself: "Would a senior engineer find this over-engineered?" If so, simplify.

### 3. Surgical Changes

**Change only what must change. Clean up only the mess you made.**

When editing existing code:

- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor what is not broken.
- Match the existing code style, even if you would write it differently.
- If you notice unrelated dead code, mention it — but do not delete it.

When your change leaves orphaned code:

- Remove imports/variables/functions that became unused **because of your change**.
- Do not delete pre-existing dead code unless asked.

Acceptance criterion: every changed line must trace back to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Iterate until they are met.**

Turn tasks into verifiable goals:

- "Add validation" → "Write tests for invalid input, then make them pass"
- "Fix this bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure the tests pass both before and after the refactor"

For multi-step tasks, state a short plan:

```
1. [Step] → Verify: [check]
2. [Step] → Verify: [check]
3. [Step] → Verify: [check]
```

Strong success criteria let you iterate independently. Weak ones ("just make it work") require constant clarification.

### 5. Analysis & Completion Notes

- Write analysis and reasoning in Chinese by default; avoid English unless necessary, except for quoted sentences.
- End every completed task with: **报告：任务已完成**.

## Project-Specific Constraints & Guidelines

### Changelog

- The changelog (`docs/Changelog.md`) is a reference for **users**, written for consumers rather than developers.
- Entries describe user-visible changes (new features, fixed issues, behavior changes, etc.) in plain, simple language.
- **Do not reference internal code elements**: no file names, function names, module names, class names, or internal implementation details.
- Group each version by category (`Added` / `Fixed` / `Changed` / `Maintenance`) and list each change that matters to users.

### Versioning

- Bug fixes and line-level code adjustments: bump the version by `0.0.1` (e.g. 1.0.0 → 1.0.1).
- Feature enhancements and module-level adjustments: bump by `0.1.0` (e.g. 1.0.0 → 1.1.0).
- Major changes: bump the major version by 1 (e.g. 1.0.0 → 2.0.0).

### Code Style

- Follow the Airbnb JavaScript Style Guide unless a specific situation requires otherwise.
- Use `camelCase` for variables, `PascalCase` for functions, and `UPPER_SNAKE_CASE` for constants.
- Write documentable English comments; be as detailed as possible.

### Git Commits

- Always write commit messages (subject, body, and explanatory text) in English, never in Chinese or other languages.

## Absolute Rules

- Never use PowerShell to process files.
- Never add fallback code without permission — it makes code bugs hard to find. If you encounter fallback code during implementation, report it immediately; remove it only after I approve.
