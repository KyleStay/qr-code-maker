# QR Code Maker

A static, client-side QR code maker that can be hosted from GitHub Pages or any plain static file host.

## Features

- Generates QR codes entirely in the browser
- No server, build step, or runtime CDN dependency
- Adjustable error correction, size, margin, and colors
- Copy generated QR codes to the clipboard as PNG images
- SVG and PNG downloads

## Local Use

Open `index.html` in a browser.

## Shareable URLs

The app syncs the QR text into the `text` query parameter:

```text
https://kylestay.github.io/qr-code-maker/?text=Hello%20world
```

Add `mode=share` for a compact QR-only view with copy and download actions:

```text
https://kylestay.github.io/qr-code-maker/?text=Hello%20world&mode=share
```

## GitHub Pages

Serve the repository from the root of the default branch in the repository Pages settings.

## Vendor

QR encoding is provided by `qrcode-generator` v1.4.4 by Kazuhiko Arase, licensed MIT.
