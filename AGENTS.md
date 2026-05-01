# Repository Guidelines

## Project Structure & Module Organization
This repository is a Microsoft MakeCode (PXT) extension for ESP8266 AT-mode networking on micro:bit.
- Core package metadata: `pxt.json`
- Source modules: `main.ts` (core APIs), `blynk.ts`, `sntp.ts`, `telegram.ts`, `thingspeak.ts`
- Test program: `test.ts` (listed under `testFiles` in `pxt.json`)
- Docs/assets: `README.md`, `icon.png`, `_config.yml`
- Tooling: `Makefile`, `tsconfig.json`, `Gemfile`

Keep feature code in focused module files and expose user-facing blocks/APIs through the package entry points.

## Build, Test, and Development Commands
Use the repo `Makefile` targets or direct `pxt` commands.
- `rtk make build` or `rtk pxt build`: compile the extension
- `rtk make test` or `rtk pxt test`: run package tests (`test.ts`)
- `rtk make deploy` or `rtk pxt deploy`: deploy to a connected micro:bit
- `rtk pxt install`: install/update local PXT dependencies when needed

If `rtk` is unavailable, run the same commands without the `rtk` prefix.

## Coding Style & Naming Conventions
- Language: TypeScript targeting ES5 (`tsconfig.json`)
- Indentation: 4 spaces; avoid tabs
- Enforce strictness expectations (`noImplicitAny: true`): add explicit types for public APIs and non-obvious locals
- File names: lowercase module names (for example `thingspeak.ts`)
- API names: `camelCase` verbs for functions (for example `connectWiFi`, `updateInternetTime`)
- Keep MakeCode block-facing logic simple and hardware-oriented; avoid unrelated abstractions

## Testing Guidelines
- Add/update tests in `test.ts` for new behaviors and bug fixes
- Prefer deterministic tests (serial timing/network state can be flaky)
- Validate both success and failure states for connectivity flows
- Run `rtk make test` before opening a PR

## Commit & Pull Request Guidelines
Git history favors short, imperative commit messages (for example `Fix Internet Time parsing`, `Update README`).
- Commit format: concise imperative summary; include scope when useful
- PRs should include:
  - What changed and why
  - Hardware/firmware assumptions (for example ESP-AT version)
  - Test evidence (`pxt test` output, device verification notes)
  - Screenshots only when documentation/UI assets change

## Security & Configuration Tips
- Never commit WiFi SSIDs/passwords, tokens, or API keys used in examples/tests
- Keep sample credentials as placeholders like `"my_ssid"`, `"my_password"`
