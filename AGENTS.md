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

- For any repository change, finish by committing, pushing to GitHub, and creating a new release tag before handing it back.
- Do not leave uncommitted changes in the working tree after a fix.
- Create a new release or version tag after the change is ready to share.
- Test the extension through the MakeCode flow described in the VS Code getting-started guide: use a local `pxt serve` session for development, then verify the published GitHub URL in a separate MakeCode project.
- Keep `README.md` and `pxt.json` in sync with the released version.

## Security & Configuration Tips

- Do not commit real WiFi credentials, API keys, or device tokens.
- Keep service hostnames and API paths in constants so they are easy to review and update.
