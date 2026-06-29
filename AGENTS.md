# Repository Guidelines

## Project Structure & Module Organization

This repository is a Microsoft MakeCode extension for the ESP8266 WiFi module.

- `main.ts` contains shared UART, WiFi, and helper functions.
- Feature modules live in separate files: `blynk.ts`, `thingspeak.ts`, `telegram.ts`, `sntp.ts`, and `velozz.ts`.
- `test.ts` is the project’s local smoke test entry point.
- `README.md` documents the public blocks and usage examples.
- `pxt.json` defines the package metadata and the files published by the extension.

## Build, Test, and Development Commands

Use the PXT CLI from the repository root:

- `pxt build` compiles the extension.
- `pxt test` runs the MakeCode test file.
- `pxt deploy` builds and deploys the package for release workflows.
- `pxt serve` starts a local MakeCode editor for manual block testing.

The `Makefile` mirrors these commands via `make build`, `make test`, and `make deploy`.

## Coding Style & Naming Conventions

- Use TypeScript with 4-space indentation.
- Keep functions small and grouped by feature file.
- Use `camelCase` for functions and variables, `SCREAMING_SNAKE_CASE` for constants such as API hostnames.
- Follow the existing MakeCode block metadata style (`//% blockId=...`, `//% block="..."`) when adding blocks.
- Keep comments short and task-focused; the codebase prefers simple, readable control flow over abstraction.

## Testing Guidelines

- Add or update examples in `test.ts` when changing behavior.
- Run `pxt test` before submitting changes.
- For behavior that depends on real hardware or network services, verify with a micro:bit and ESP8266 when possible.

## Commit & Pull Request Guidelines

- Commit messages in history follow short conventional prefixes such as `feat:`, `fix:`, and `chore:`.
- Keep commits focused on one change.
- Pull requests should summarize the behavioral change, mention any hardware or network assumptions, and note manual test results.

## Release & Verification Workflow

- For any repository change, always follow the same release flow before handing the work back.
- Do not leave uncommitted changes in the working tree after a fix.
- Keep `README.md` and `pxt.json` in sync with the released version.
- Only push release commits, tags, and GitHub releases to `https://github.com/mersdev/pxt-esp8266`.
- The release commit must come from `pxt bump --nopr`; do not hand-edit the version.
- Release steps:
  1. Run `pxt test` and make sure the package builds cleanly.
  2. Run `pxt bump --nopr` from the repo root to create the next package version commit.
  3. Accept the suggested version number unless a different one is required.
  4. Push the new commit and the matching `vX.Y.Z` tag to `https://github.com/mersdev/pxt-esp8266`.
  5. Create a GitHub release for the same tag.
  6. Verify the extension in MakeCode using the published GitHub URL for `https://github.com/mersdev/pxt-esp8266`, then update any project that still shows an older version such as `2.1.12`.

When a change is committed, the release step is not complete until the GitHub tag and release exist.

## Security & Configuration Tips

- Do not commit real WiFi credentials, API keys, or device tokens.
- Keep service hostnames and API paths in constants so they are easy to review and update.
