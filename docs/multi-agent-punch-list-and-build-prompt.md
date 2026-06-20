# QR Code Maker Multi-Agent Punch List and Build Prompt

This document synthesizes a multi-agent review of the static QR Code Maker app for UX, feature opportunities, performance, correctness, and review/test workflow.

## Current App Snapshot

- Static browser-only app with no build step or server requirement.
- Core files: `index.html`, `styles.css`, `app.js`, `qrcode.js`, `README.md`.
- Existing capabilities: plain text, URL, email, phone, SMS, and Wi-Fi payload helpers; QR generation; error correction; export size presets and custom size; margin and colors; transparent background; PNG/SVG downloads; copy image; share URLs; compact share mode.
- Constraints: preserve direct `index.html` usage, avoid new required dependencies, keep `qrcode.js` unchanged unless a confirmed encoder bug requires it.

## Ranked Punch List

### P1: Fix Template State Consistency

**Problem:** Switching from plain text to a helper template can leave stale QR content in the read-only generated content field when the selected helper has no fields filled.

**Evidence:** `updateTemplateVisibility()` sets `#qrInput` read-only for non-text types, but empty templates can continue rendering the old textarea value. Template parsing currently happens during URL restore, not during user-driven type changes.

**User impact:** Users can believe they are generating an empty URL/email/Wi-Fi code while the app is still showing or encoding old content.

**Acceptance criteria:**
- Changing content type either parses compatible existing content into helper fields or clears generated content.
- Visible helper fields and generated QR payload always agree.
- No manually entered text is destroyed without an obvious user action.

### P1: Make Mobile Flow QR-First

**Problem:** On narrow screens, users must scroll through the editor and controls before seeing whether a QR was generated.

**Evidence:** Mobile layout keeps editor first and preview second. At `390x844` and `320x568`, preview begins roughly after the first long editor section.

**User impact:** The primary payoff is hidden, making the app feel slower and less confidence-building on phones.

**Acceptance criteria:**
- On `390x844`, after entering content, QR feedback is visible within the first screen or immediately after the content field.
- No horizontal scrolling.
- Export/share actions remain reachable.
- Advanced controls do not block the primary create/scan loop.

### P1: Prevent Accidental Credential Sharing

**Problem:** Share URLs can expose sensitive data, especially Wi-Fi passwords.

**Evidence:** The app serializes helper params and full `text` into the URL, including `wifiPassword`.

**User impact:** A user can unknowingly copy/share network credentials in a URL.

**Acceptance criteria:**
- Wi-Fi/password sharing is explicit.
- The UI warns when a share link contains a Wi-Fi password.
- Provide a clear option to share without the password or require confirmation before copying credential-bearing links.
- README documents the privacy behavior.

### P1: Coalesce Expensive Render and URL Sync Work

**Problem:** QR generation and URL syncing run synchronously on each input, slider, template, and color event.

**Evidence:** `renderAndSyncUrl()` runs immediately from input handlers. QR generation auto-selects a QR version and computes masks synchronously. URL serialization can also happen twice per change.

**User impact:** Large pasted payloads, high error correction, or repeated slider/color changes can freeze the UI.

**Acceptance criteria:**
- Input and template changes are debounced or requestAnimationFrame-coalesced.
- A large paste near QR capacity produces at most one generation after input settles.
- Each user gesture performs at most one QR render and one share URL serialization.
- UI remains responsive while editing long payloads.

### P1: Bound Share URL Length

**Problem:** Oversized content can be written into the address bar and share field even when QR generation fails.

**Evidence:** Full text is appended to the `text` query parameter; history is rewritten on sync even for oversized/failed payloads.

**User impact:** Browser URL limits vary. Huge URLs can make the app slow, ugly, or impossible to share.

**Acceptance criteria:**
- Define a maximum shareable URL length.
- Stop rewriting history beyond that limit.
- Show a clear "too large for URL sharing" state while keeping QR generation/export usable.
- Share link copy is disabled or explained when the URL would be too long.

### P2: Improve Share Mode Hierarchy

**Problem:** Compact share mode is not QR-dominant enough on small screens.

**Evidence:** At `320x568`, the QR can render around `204px` due to padding and surrounding controls. The share URL field competes with scan/copy/download actions.

**User impact:** Share mode feels like a shrunken editor output rather than a clean scan-first page.

**Acceptance criteria:**
- On `320x568`, QR is visually dominant and at least about `230px` wide.
- Primary scan/copy/download action is visible without excessive scrolling.
- Share URL is hidden, collapsible, or secondary in share mode.

### P2: Fix Mid-Width Control Crowding

**Problem:** At `1024x768`, segmented controls crowd and can clip labels such as error correction and size presets.

**Evidence:** The editor two-column grid gives each control column limited width.

**User impact:** Controls look broken and become harder to scan.

**Acceptance criteria:**
- At `1024x768`, all segmented labels are readable.
- No internal horizontal overflow.
- Controls stack earlier or use responsive tracks/short labels cleanly.

### P2: Clarify Generated Content

**Problem:** For helper templates, `QR content` is read-only but still looks like the main authoring field.

**User impact:** Users may try to edit the generated payload and think the app is broken.

**Acceptance criteria:**
- Label or helper text clearly communicates that template fields are editable and the textarea is generated output.
- Keyboard focus order remains sensible.
- Screen readers get the same distinction.

### P2: Add Export Busy and Success Feedback

**Problem:** PNG/SVG download success is silent, and PNG generation can be clicked repeatedly during expensive 4096px canvas work.

**User impact:** Users may double-click, stack work, or wonder whether an export happened.

**Acceptance criteria:**
- PNG export disables relevant buttons while generating.
- Concurrent PNG/copy export work is prevented.
- SVG and PNG downloads announce completion in the status area.
- Failures are clearly reported.

### P2: Make Scannability Guidance Actionable and Accessible

**Problem:** Warnings explain risk but do not offer direct fixes, and status depends partly on colored dots.

**Acceptance criteria:**
- Warning text includes direct remedies, such as "Set margin to 4" or "Use dark foreground on light background."
- Status items include textual "OK" / "Warning" labels or screen-reader equivalent.
- Add a preview-level status such as "Ready to scan" or "Needs attention."

### P2: Add High-Value Templates

**Opportunity:** Add common QR payloads that fit the existing static helper model.

**Recommended order:**
1. Contact/vCard.
2. Calendar event.
3. Location/map link.
4. App store/deep link.

**Acceptance criteria:**
- New templates preserve generated payload visibility, share URLs, export, and restore behavior.
- Payload builders escape required fields correctly.
- README lists new content types.

### P3: Reduce Share URL Noise

**Problem:** The read-only Share URL field is always visible even when "Copy Share Link" is the primary interaction.

**Acceptance criteria:**
- Share URL remains available as a clipboard fallback.
- It is collapsed, secondary, or shown only after copy failure in normal mode.
- Share mode does not foreground a long URL.

### P3: Make Example Context-Aware

**Problem:** The `Example` button always resets to plain text and loads `https://example.com`.

**Acceptance criteria:**
- Example respects the selected content type and fills realistic sample data.
- It does not surprise users by switching modes unnecessarily.

### P3: Add Lightweight App Polish

**Opportunities:**
- Add a tiny favicon to avoid `/favicon.ico` 404 during static serving.
- Improve action hierarchy: choose a primary action such as `Download PNG` or `Copy Image`, with SVG secondary.
- Add a compact trust/status header above preview.

## Recommended Implementation Phases

### Phase 1: Reliability and Mobile UX

Scope:
- Template state consistency.
- Mobile QR-first layout.
- Share mode hierarchy.
- Mid-width control crowding.
- Generated content clarity.

Why first: These directly affect whether users trust what the app is generating and whether the main flow feels good on mobile.

### Phase 2: Privacy and Performance

Scope:
- Wi-Fi/password share warning or confirmation.
- Share URL length cap.
- Debounced/coalesced rendering and URL syncing.
- Remove duplicate share URL serialization.
- Export busy states.

Why second: These reduce risk and make the app more robust with large payloads and sensitive data.

### Phase 3: Features and Testability

Scope:
- vCard/contact template.
- Context-aware examples.
- Extract pure helpers for payload builders/parsers and URL state.
- Add focused tests or browser smoke checks.

Why third: These expand product value after the highest-confidence usability and reliability issues are handled.

## Build, Review, and Test Prompt for a Team of Agents

```text
You are a coordinated team of Codex agents improving a static, client-side QR Code Maker app.

Repository context:
- App type: static browser-only QR generator.
- Core files: index.html, styles.css, app.js, qrcode.js, README.md.
- The app must keep working by opening index.html directly in a browser.
- Do not add a required server, build step, package manager, framework, or CDN dependency.
- Keep qrcode.js unchanged unless a confirmed QR encoder bug requires otherwise.
- Preserve existing features: content helpers, QR generation, error correction, export size, margin, colors, transparent background, PNG/SVG download, image copy, share URLs, and compact share mode.

Mission:
Implement, review, and test the highest-value UX, privacy, performance, and feature improvements from the punch list. Keep the app simple, polished, accessible, and static.

Non-negotiables:
- Do not rewrite the whole app.
- Do not remove existing user-facing features.
- Do not hide root-cause problems with brittle CSS.
- Do not introduce dependencies unless every agent agrees they are necessary and static-file compatible.
- No text, controls, or QR output may overlap or clip in supported viewports.
- Privacy behavior around Wi-Fi passwords must be explicit.
- Final work must be visually and functionally verified before handoff.

Priority scope:
1. Fix template state consistency when changing content types.
2. Improve mobile normal mode so QR feedback appears much earlier.
3. Improve compact share mode so the QR is dominant on small screens.
4. Prevent accidental sharing of Wi-Fi passwords.
5. Cap or disable oversized share URLs with clear feedback.
6. Coalesce/debounce render and URL sync work.
7. Prevent concurrent large PNG/copy exports and add export success feedback.
8. Fix mid-width segmented-control crowding.
9. Clarify read-only generated content for helper templates.
10. Add actionable and accessible scannability guidance.

Stretch scope after priority items pass:
- Add contact/vCard template.
- Make Example context-aware for each content type.
- Add favicon.
- Extract pure helper functions for future tests.

Team roles:

Agent 1: UX/Product Lead
- Own user flow decisions and mobile ordering.
- Confirm the smallest coherent product changes for the priority scope.
- Define acceptance criteria for each implemented change.
- Watch for surprise behavior, especially template switching and share URLs.

Agent 2: Layout/Accessibility Implementer
- Own index.html and styles.css changes.
- Fix mobile normal mode, share mode hierarchy, mid-width control crowding, generated-content clarity, focus/readability, and status semantics.
- Keep controls native and accessible.
- Avoid nested cards, decorative-only flourishes, and marketing-page patterns.

Agent 3: JavaScript Reliability Implementer
- Own app.js changes for template state, URL/share behavior, privacy warnings, debounce/coalescing, export busy states, and scannability text.
- Keep behavior direct-file compatible.
- Avoid overbroad abstractions, but extract small pure helpers when it materially reduces risk.
- Preserve share URL restore behavior.

Agent 4: Feature Implementer
- Own stretch features only after priority work stabilizes.
- Add vCard/contact template and context-aware examples if time/risk permits.
- Update README for any new content type or changed privacy/share behavior.

Agent 5: QA and Visual Verification
- Test the implemented app in a real browser.
- Verify normal mode at:
  - 1440 x 1100
  - 1024 x 768
  - 768 x 1024
  - 390 x 844
  - 320 x 568
- Verify share mode at:
  - 1440 x 1100
  - 390 x 844
  - 320 x 568
- For each viewport, check no horizontal scroll, no overlapping text, readable segmented controls, visible focus outlines, visible QR preview, reachable actions, and legible status messaging.
- Functional checks:
  - Empty state
  - Long text payload
  - URL helper
  - Email helper
  - Phone helper
  - SMS helper
  - Wi-Fi helper with special characters and hidden network
  - Wi-Fi password share warning/confirmation
  - Oversized share URL behavior
  - Error correction L/M/Q/H
  - Size presets and custom clamp behavior
  - Margin slider
  - Foreground/background color changes
  - Transparent background
  - Copy share link
  - Copy image or browser fallback
  - Download SVG
  - Download PNG
  - Clear
  - Query restore for text, mode=share, ecc, size, margin, fg, bg, transparent, and helper params

Agent 6: Code Review and Repository Steward
- Review the final diff from a bug-risk perspective first.
- Check for regressions to existing features, CSS that only works in one viewport, inaccessible labels/focus handling, state sync bugs, clipboard/download regressions, overbroad rewrites, unrelated file changes, and missing README updates.
- Request revisions for blocking issues.
- After blocking issues are fixed, confirm final state and stage approved files only if asked.

Severity guide:
- P0: App cannot generate/export/share QR codes, or core flow is unusable.
- P1: Major UX, privacy, correctness, or performance issue affecting common use.
- P2: Noticeable quality, accessibility, or reliability issue that should be fixed before handoff if practical.
- P3: Polish or follow-up idea that should not block.

Process:
1. UX/Product Lead confirms the phase scope.
2. Layout and JavaScript implementers work in disjoint files where possible.
3. Feature Implementer waits until priority changes stabilize.
4. QA verifies priority flows and records failures.
5. Code Review inspects the diff and requests revisions.
6. Implementers fix all blocking QA/review issues.
7. QA reruns affected checks.
8. Final summary reports changes, files touched, verification performed, known limitations, and recommended follow-ups.

Definition of done:
- App still runs from index.html with no required server/build/dependency.
- Existing features still work.
- Mobile normal mode and compact share mode are QR-first and readable.
- Template fields and generated payload never disagree.
- Wi-Fi password sharing is explicit.
- Oversized share URLs are handled without slowing or breaking the app.
- Large edits and exports do not allow obvious UI freezes or stacked export work.
- No text, controls, or QR output overlap or clip at tested viewports.
- Keyboard navigation and focus visibility are acceptable.
- README is updated for behavior changes.
```

