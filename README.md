# KeyPulse v6.3

KeyPulse is a privacy-first static browser utility for extracting environment/config variable names and comparing two `KEY=value` files.

## What is new in v6.3
- Complete UI redesign focused on simple, fast workflows
- Clear A/B comparison cards and semantic status colors
- Interactive Missing / Extra / Different / Matching filters
- “Show only differences” mode
- Search filters variable names without changing global counters
- Optional “Show values” switch for Value/Both comparison modes
- Copy a single variable name from any result row
- One-click comparison reset
- Cleaner empty states, responsive mobile layout and compact navigation
- Local metadata history remains secret-safe
- Animated UPI support modal retained
- Full project download retained

## Privacy architecture
All file reading, parsing and comparison happens in the browser. No file upload endpoint, backend, database, analytics service or external API is required.

No local history is browser storage only. It contains metadata such as filenames, counts, comparison mode, status totals and timestamps — never configuration values.

## Run
Open `index.html` directly, or deploy the folder to a static host such as Cloudflare Workers/Pages, GitHub Pages, Netlify or another static host.

## Supported input
The parser understands lines such as:

```env
DATABASE_URL=...
export API_KEY=...
JWT_SECRET="..."
```

Blank lines and `#` comments are ignored. Duplicate keys are de-duplicated.

## Comparison modes
- **Variables** — compares whether keys exist in each file.
- **Values** — compares values for shared keys.
- **Both** — shows presence differences and value differences.

Values are hidden unless the user explicitly enables **Show values**.

## Payment / support
The footer includes a UPI support QR for `8651600737@ptaxis`. Payment is handled by the user's UPI application. KeyPulse does not verify or store payment credentials.

## Included
- Variable extraction with values removed from output
- Two-file comparison by variable, value, or both
- Exact missing/extra/different/matching counts
- Search, status filters and problem-only mode
- Per-key copy actions
- Local metadata history
- Full-project ZIP download button
- Animated UPI support area
- Contact links
- Terms of Use, License and Security notes
- No server required


### Same-file recheck
On supported browsers (including current Chrome/Edge), use **Browse** to select comparison files. KeyPulse keeps a browser-local File System Access handle and the **↻ Recheck files** button re-reads those same files from their original locations and recalculates the comparison. No path or file contents are uploaded or stored. Drag-and-drop remains available, but dropped files cannot provide a reusable same-path handle in the browser.
