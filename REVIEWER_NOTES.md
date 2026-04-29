# Reviewer notes — ChatGPT Shortcut Buttons

## TL;DR
Install. Visit `https://chatgpt.com`. A row of pill buttons appears above the chat box. No login, no setup, no test account.

## Single purpose
Adds shortcut buttons above ChatGPT's chat box that toggle ChatGPT's own built-in features (thinking modes, web search, image generation, deep research, etc.). Each button mirrors and controls a feature that ChatGPT already exposes through its `+` menu, model switcher, or file picker.

## Permissions

| Permission | Why                                                                 |
| ---------- | ------------------------------------------------------------------- |
| `storage`  | Persist two booleans: a master enable flag and a per-button visibility map. |

No `host_permissions`. The content script runs only on `chatgpt.com` and `chat.openai.com` via `content_scripts.matches`.

## Test steps

1. Load the unpacked extension or upload the ZIP.
2. Open a new tab to <https://chatgpt.com>.
3. **Expected**: a horizontal row of pill buttons appears above the chat box (Upload paperclip, Standard thinking, Extended thinking, Web search, Create image, Deep research by default).
4. Click **Web search** — it turns blue, and ChatGPT's own "Search" pill appears in the chat box.
5. Click **Web search** again — both turn off.
6. Click **Standard thinking**, then **Extended thinking** — they're mutually exclusive (toggling one turns the other off) and the model switcher updates.
7. Click the paperclip — the native file picker opens.
8. Click the toolbar icon. **Expected**: a popup with a master toggle and per-button toggle switches. Flipping a per-button toggle hides/shows that pill instantly. Flipping the master toggle removes the entire bar from chatgpt.com instantly.
9. Navigate between conversations in the sidebar. **Expected**: the pill bar stays / re-appears after each navigation (handled via a `MutationObserver`, no refresh needed).

## Network behavior
None. The extension makes zero network requests. There is no background service worker, no `fetch`, no analytics, no remote config.

## Special setup
None required. No login, no API key, no payment. All features are free and immediately functional after install.

## Known caveats
- ChatGPT changes its DOM occasionally. The extension uses a small set of stable selectors (`form.group/composer`, `[data-testid="composer-plus-btn"]`, `[data-testid="model-switcher-dropdown-button"]`, `.__composer-pill`, etc.). If a selector changes upstream, individual buttons may stop working until the extension is updated. This does not affect ChatGPT's own functionality.

## Source
Open source at <https://github.com/m-a-x-c/chat-gpt-buttons>.
