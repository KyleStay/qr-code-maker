# QR Code Maker

A static, client-side QR code maker that can be hosted from GitHub Pages or any plain static file host.

## Features

- Generates QR codes entirely in the browser
- No server, build step, or runtime CDN dependency
- Content helpers for URLs, email, phone, SMS, and Wi-Fi QR payloads
- Scan guidance for contrast, quiet-zone margin, payload size, and error correction
- Adjustable error correction, size, margin, and colors
- Share URLs that preserve QR text, size, margin, colors, and error correction
- Copy generated QR codes to the clipboard as PNG images
- SVG and PNG downloads

## Local Use

Open `index.html` in a browser.

## Shareable URLs

The app syncs the QR text into the `text` query parameter:

```text
https://kylestay.github.io/qr-code-maker/?text=Hello%20world
```

When other query parameters are present, `text` is always written last so it remains easy to edit by hand.

QR settings can also be shared with `ecc`, `size`, `margin`, `fg`, and `bg` query parameters. The visible Share URL field and Copy Share Link button include these settings automatically.

Add `mode=share` for a compact QR-only view with copy and download actions:

```text
https://kylestay.github.io/qr-code-maker/?mode=share&text=Hello%20world
```

## GitHub Pages

Serve the repository from the root of the default branch in the repository Pages settings.

## Vendor

QR encoding is provided by `qrcode-generator` v1.4.4 by Kazuhiko Arase, licensed MIT.
