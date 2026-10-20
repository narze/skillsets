# Codex install

`./codex-install.sh` adds this repo as the `skillsets` Codex marketplace, installs each provider as a plugin, and turns all of them off in `config.toml`, so they load only when a session turns them on.

## Sub-features

- `codex-marketplace` adds `[marketplaces.skillsets]` with `source = "<repo root>"`.
- `codex-plugins` installs one `<provider>@skillsets` plugin for each provider folder, copied under `$CODEX_HOME/plugins/cache/skillsets/`.
- `codex-disabled` writes `enabled = false` for each `[plugins."<provider>@skillsets"]`.
- `codex-home` uses `$CODEX_HOME` when it is set.

## How to get to it (user POV)

- `./codex-install.sh` from the repo root, one time, and again after `./fetch.sh` (README "Codex CLI").

## Driving it with verify.sh

Preconditions:

- `codex` is on `PATH`. No network or login is needed for a local marketplace.
- A new scratch folder: `CH="$TMPDIR/skillsets-verify-codex-$$"; mkdir -p "$CH"`.
- Record the real config time: `stat -f '%Sm' ~/.codex/config.toml > "$SKILLSETS_VERIFY_OUT/codex-real-before.txt"`.

- **Install.** Run `CODEX_HOME="$CH" ./codex-install.sh 2>&1 | tee "$SKILLSETS_VERIFY_OUT/codex-install.txt"`. Exit code `0`, one `Added plugin \`<provider>\`` line for each provider, and the last line `==> Done.`
- **Config.** Run `cp "$CH/config.toml" "$SKILLSETS_VERIFY_OUT/codex-config.toml"`. It has `[marketplaces.skillsets]` and `enabled = false` for each provider.
- **List.** Run `CODEX_HOME="$CH" codex plugin list | grep skillsets`. Each provider shows `installed, disabled`.
- **Real home unchanged.** Run `stat -f '%Sm' ~/.codex/config.toml` and compare with `codex-real-before.txt`. They are equal.
- **Cleanup.** Remove the scratch folder by its literal path, for example `rm -rf /var/folders/.../T/skillsets-verify-codex-123`. Claude Code blocks `rm -rf "$CH"` with a variable.

## Gotchas

- Without `CODEX_HOME`, the script changes the user's real `~/.codex/config.toml`. Never run it that way during verification.
- macOS `stat` uses `-f`, Linux uses `-c`. 
- The installed plugins are copies. After a provider changes, run the script again, or the Codex check proves the old copy.
