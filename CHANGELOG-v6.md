## v6.4 — File picker + copy workflow

- Removed restrictive extension filtering from the native file picker; `.env.test`, `.env.prod`, and other config/text filenames are selectable.
- Fixed the Extract panel LOCAL / VALUES REMOVED tags so they render as compact pills instead of giant boxes.
- Added row selection and bulk copy controls: Select visible, Clear, Copy selected, Copy keys, Copy values, and Copy all.
- Bulk copy respects the current search/filter view.

# KeyPulse v6 — Changelog

## Redesign
- Rebuilt the entire visual system around a calmer developer-tool interface.
- Reduced decorative animation and increased readability.
- Added responsive mobile navigation and layouts.
- Added semantic colors for missing, extra, different and matching states.

## Comparison UX
- Click any result counter to filter.
- Added All / Missing / Extra / Different / Matching filters.
- Added Show only differences.
- Added optional Show values.
- Search now filters variable names only and never changes the global counters.
- Added Copy key actions.
- Added Reset comparison.

## Privacy
- Local history continues to store metadata only.
- Config values are not written to localStorage.
- Values are only rendered when the user explicitly enables Show values.

## v6.1 — Value mismatch insight
- Added a **Value changes** filter that finds shared keys whose values differ, even when the current comparison mode is Variables.
- Matching keys with changed values now receive a clear **Value differs** badge.
- **Show only differences** now includes value-changed keys.
- Value rows can show A/B values for missing, extra, and changed keys when **Show values** is enabled.
- Value-change counts remain separate from structural Missing/Extra/Different counters so the summary stays accurate.


## v6.2
- Removed the History feature and its navigation/section.
- Removed history persistence and history UI logic.
- Existing v6.1 history storage key is cleared once on load.

## v6.3 — Same-file recheck
- Added **↻ Recheck files** for comparison.
- Browse-selected files can be re-read from their original location without selecting them again.
- Rechecking recalculates parsing, variable counts, missing/extra/different/matching results, and value changes.
- Drag-and-drop remains supported; same-path recheck requires Browse because browsers do not expose a reusable local file handle for dropped files.
- No file contents, paths, or handles are uploaded or stored on a server.


## v6.2 — Same-file Recheck
- Added **↻ Recheck files** for comparison.
- Browse-selected files can be re-read from their original location without selecting them again.
- Rechecking recalculates parsing, variable counts, missing/extra/different/matching results, and value changes.
- Drag-and-drop remains supported; same-path recheck requires Browse because browsers do not expose a reusable local file handle for dropped files.
- No file contents, paths, or handles are uploaded or stored on a server.

## v6.5
- Fixed file picker behavior so config files are not restricted to `.env`.
- Browse now accepts arbitrary local config/text file types, including extensionless and custom environment files such as `.env.test`, `.env.prod`, `.conf`, `.ini`, `.properties`, `.yaml`, `.json`, and more.
- Reworked the file picker fallback to explicitly allow all files.
- Fixed `LOCAL` and `VALUES REMOVED` badges becoming tall/vertical by forcing compact pill dimensions.
- Replaced ambiguous arrow file controls with clear `Browse` buttons.
