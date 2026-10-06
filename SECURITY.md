# KeyPulse Security Notes

- File parsing happens in the browser.
- No backend is required.
- No configuration contents are written to localStorage.
- Local history stores only lightweight metadata: filenames, counts, comparison mode, status totals, and timestamps.
- Payment is handled by the user's UPI application.
- Do not use browser extensions or devices you do not trust when working with production secrets.
