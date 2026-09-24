# Testing — read before verifying anything

Two tools, both already installed:

1. **Scripted acceptance** (regression gate, run after every change):
   `node tests/acceptance.js` and `node tests/reduced-check.js` from this directory.

2. **playwright-cli** (interactive exploration, token-efficient; state goes to disk):
   ```bash
   python3 -m http.server 8765 &          # file:// is blocked by the CLI, serve over http
   playwright-cli -s=app open http://localhost:8765/ --device "iphone 15"
   playwright-cli -s=app snapshot          # element refs (e12...) saved to .playwright-cli/
   playwright-cli -s=app click e12
   playwright-cli -s=app find "PA 90/55"   # assert text is / is not on screen
   playwright-cli -s=app screenshot
   playwright-cli -s=app close; kill %1
   ```
   Config: `.playwright/cli.config.json` points to the bundled Chromium (no system Chrome here).
   Use it to walk flows a human would (role switch mid-detail, sheet open → role switch, etc.)
   and turn every bug you find into an assertion in `tests/acceptance.js`.

Stay inside this directory. Do not read or glob the parent folder.
