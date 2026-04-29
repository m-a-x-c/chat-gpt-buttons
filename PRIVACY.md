# Privacy policy — ChatGPT Shortcut Buttons

_Last updated: 2026-04-29_

## Single purpose
ChatGPT Shortcut Buttons adds a row of one-click toggle buttons next to ChatGPT's chat box that shortcut to features ChatGPT already provides. Its single purpose is improving the ergonomics of ChatGPT's own UI; it does not provide any other functionality.

## What the extension stores
The extension stores **user preferences only**, via `chrome.storage.sync`:

| Key                | Type     | What it is                                                              |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| `extensionEnabled` | boolean  | Master on/off switch. Default: on.                                      |
| `visiblePills`     | object   | Per-button visibility map (e.g. `{ webSearch: true, agentMode: false }`).|

These keys hold **booleans only** — no text, no usage data, no chat content, no identifiers.

`chrome.storage.sync` is a Chrome-managed sync mechanism. Preferences are stored on the user's own Google account so they roam between the user's signed-in Chrome installs. The extension itself never reads or transmits the values to any other party.

## Data the extension does NOT collect
The extension does **not** collect, transmit, or have access to any of the following:

- Personally identifiable information (name, email, address, phone, ID).
- Authentication info (passwords, tokens, cookies).
- Chat content, prompts, responses, or attachments.
- Browsing history.
- Page content from any site (it does inspect a small set of selectors on `chatgpt.com` to mirror ChatGPT's pill state, but that data is read in-memory and never stored or transmitted).
- Location.
- Financial info.
- Health info.

## Network requests
The extension makes **no network requests of its own**. There is no background service worker, no `fetch` / `XMLHttpRequest`, no analytics, no remote configuration. Its content script and popup run entirely in the user's browser.

## Third parties
- The extension does not share any data with any third party.
- The extension does not sell any data.
- The extension does not use data for advertising or behavioural profiling.

## Permissions
- `storage` — to persist the preferences described above.
- No host permissions; the content script runs only on `https://chatgpt.com/*` and `https://chat.openai.com/*` via `content_scripts.matches`, the narrowest available mechanism.

## Data retention and deletion
Preferences live only in the user's Chrome `storage.sync`. Removing them:

1. Toggle settings as desired in the extension popup, or
2. Open `chrome://settings/syncSetup/advanced` to manage sync data, or
3. Uninstall the extension — Chrome removes the extension's storage automatically.

## Security
Because the extension performs no transmission, there is no transmission to secure. Local storage uses Chrome's built-in encryption-at-rest where the OS provides it.

## Contact
Questions or requests: open an issue at <https://github.com/m-a-x-c/chat-gpt-buttons/issues>.
