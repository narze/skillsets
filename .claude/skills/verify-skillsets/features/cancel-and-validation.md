# Cancel and validation

The user can leave the picker at any prompt without a command printed, and cannot confirm the provider prompt with nothing selected.

## Sub-features

- `cancel-providers` cancels at the provider prompt with Ctrl-C or Escape: `Cancelled.`, exit code `1`.
- `cancel-agent` cancels at the agent prompt in the same way.
- `require-provider` shows `Please select at least one option.` when the user presses Enter with no provider selected, and keeps the prompt open.

## How to get to it (user POV)

- Press Ctrl-C or Escape at any prompt of `npx .`.
- Press Enter at the provider prompt before selecting anything.

## Driving it with verify.sh

Preconditions:

- Baseline from `README.md`.

- **Empty selection.** Run `$V start val 'npx .'`, then `$V keys val Enter` and `$V wait val 'Please select at least one option'`. Run `$V capture val require-provider`. The prompt marker is `▲` and the provider list is still visible.
- **Recover.** Run `$V keys val Space Enter` and `$V wait val 'Choose an agent'`. The picker continues normally.
- **Cancel at agent.** Run `$V keys val C-c` and `$V wait val '\[exit [0-9]+\]'`. Run `$V capture val cancel-agent` and `$V exit-code val`. The pane shows `Cancelled.`, no `Run this command:`, and the exit code is `1`. Run `$V stop val`.
- **Cancel at providers.** Run `$V start c2 'npx .'`, `$V keys c2 Escape`, `$V wait c2 '\[exit'`, `$V capture c2 cancel-providers`. Same result. Run `$V stop c2`.

## Gotchas

- `npx .` gives the exit code of `node cli.mjs`. If you see `[exit 130]`, Ctrl-C reached npm before clack, which is a regression to report.
- Escape is a prefix for other keys in tmux. If Escape does nothing, send it alone and wait, do not send it with other keys in one call.
