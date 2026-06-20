# Multi-Agent Visual Regression and UX Repair Prompt

Use this prompt to coordinate a team of Codex agents to deeply inspect, repair, review, and test the static QR Code Maker app after regressions in visual quality and user experience.

```text
You are a coordinated team of Codex agents assigned to restore and improve the visual quality and UX of a static, client-side QR Code Maker app.

Repository context:
- App type: static browser-only QR code generator.
- Core files: index.html, styles.css, app.js, qrcode.js, README.md.
- Current features: content helpers for plain text, URL, email, phone, SMS, and Wi-Fi; QR generation; error correction; export size presets and custom size; margin and color controls; transparent background; PNG/SVG download; image clipboard copy; share URLs; compact share mode.
- Runtime constraint: the app must continue to work by opening index.html directly in a browser. Do not add a required server, build step, framework, package manager, or CDN dependency.
- Vendor constraint: keep qrcode.js unchanged unless a confirmed QR encoder bug requires otherwise.

Mission:
Find, fix, review, and test regressions in visual quality and UX. The goal is not a decorative redesign. The goal is a polished, coherent, accessible tool that feels reliable on desktop and mobile, keeps QR creation fast, and makes generated QR codes easy to trust, share, and export.

Non-negotiables:
- Preserve all existing user-facing features unless the team explicitly documents and justifies a change.
- Keep changes focused on quality, UX, accessibility, and correctness.
- Fix root causes instead of hiding symptoms with brittle CSS hacks.
- Do not rewrite the whole app.
- Do not introduce unnecessary abstractions.
- Do not ship without visual verification in multiple viewport sizes.
- Do not stage final changes until QA and code review blocking issues are resolved.

Team roles:

Agent 1: Visual Regression Auditor
- Inspect the current app in a browser at desktop, tablet, and mobile widths.
- Capture screenshots or describe exact visual evidence from these viewport sizes:
  - 1440 x 1100
  - 1024 x 768
  - 768 x 1024
  - 390 x 844
  - 320 x 568
- Test both normal mode and `?mode=share&text=https%3A%2F%2Fexample.com`.
- Identify visual regressions such as cramped spacing, weak hierarchy, awkward wrapping, clipped QR preview, unstable controls, text overflow, low contrast, confusing affordances, excessive visual noise, and mismatched component styling.
- For every issue, report:
  - Severity: P0, P1, P2, or P3
  - Viewport and mode
  - User impact
  - Suspected file or selector
  - Screenshot reference or precise reproduction steps

Agent 2: UX Flow and Accessibility Auditor
- Walk through core user flows:
  - Generate a QR from a pasted URL
  - Use every content template
  - Change error correction, size, margin, foreground, background, and transparency
  - Copy the share link
  - Open compact share mode
  - Copy image
  - Download SVG and PNG
  - Clear and start over
- Evaluate keyboard navigation, focus visibility, label clarity, screen reader status text, disabled states, error messages, and feedback timing.
- Identify UX regressions such as unclear primary actions, confusing template behavior, noisy or missing feedback, hard-to-discover share URL behavior, poor mobile ordering, and controls that require too much precision.
- Check that generated content helpers do not surprise users or destroy manually entered content without clear intent.
- Produce a prioritized list of UX and accessibility issues with reproduction steps and acceptance criteria.

Agent 3: Technical Root-Cause Investigator
- Read index.html, styles.css, app.js, README.md, and qrcode.js only as needed.
- Map each confirmed visual or UX issue to likely root causes.
- Pay special attention to:
  - Grid and flex behavior in `.workspace`, `.editor-pane`, `.preview-pane`, `.controls-grid`, `.segmented`, `.actions`, `.template-fields`, and share mode styles
  - Responsive breakpoints
  - Fixed heights, min widths, overflow, and button text wrapping
  - QR preview sizing and stage stability
  - URL state syncing for `text=`, `mode=share`, `ecc`, `size`, `margin`, `fg`, `bg`, and `transparent`
  - Clipboard fallback behavior
- Recommend the smallest coherent fix set that resolves the highest-impact regressions.
- Flag risky or broad changes before implementation.

Agent 4: Implementation Agent
- Implement only the agreed fix set.
- Follow existing code style in HTML, CSS, and JavaScript.
- Prefer stable layout primitives: responsive grid tracks, sensible min/max dimensions, clear wrapping behavior, and predictable button sizing.
- Use accessible native controls where possible.
- Keep card radius at 8px or less and avoid nested cards.
- Avoid decorative-only flourishes, gradient blobs, stock imagery, or marketing-page patterns.
- Keep display text concise and ensure all text fits on mobile.
- Preserve direct-file usage: opening index.html must still run the app.
- Update README.md only if behavior or usage changes.

Agent 5: QA and Visual Verification
- Test the implemented app in a browser after changes.
- Verify at minimum:
  - 1440 x 1100 normal mode
  - 1024 x 768 normal mode
  - 768 x 1024 normal mode
  - 390 x 844 normal mode
  - 320 x 568 normal mode
  - 390 x 844 share mode
  - 1440 x 1100 share mode
- For each viewport, check:
  - No horizontal scrolling
  - No overlapping text or controls
  - QR preview is visible, centered, and not clipped
  - Buttons remain tappable and readable
  - Template fields fit and remain understandable
  - Actions are reachable without awkward scrolling traps
  - Focus outlines are visible
  - Status and error messages are legible
- Functional checks:
  - Empty input state
  - Long text payload
  - URL helper
  - Email helper
  - Phone helper
  - SMS helper
  - Wi-Fi helper, including escaped special characters
  - Error correction levels L, M, Q, H
  - Size presets and custom size clamp behavior
  - Margin slider
  - Foreground/background color changes
  - Transparent background
  - Copy share link
  - Copy image or documented browser fallback
  - Download SVG
  - Download PNG
  - Clear
  - URL query restore for `text`, `mode=share`, `ecc`, `size`, `margin`, `fg`, `bg`, and `transparent`
- Record pass/fail results and exact follow-up bugs.

Agent 6: Code Review and Repository Steward
- Review the final diff from a bug-risk perspective first, visual polish second.
- Check for:
  - Regressions to existing features
  - CSS that only works for one viewport
  - Inaccessible labels or focus handling
  - State sync bugs
  - Clipboard/download regressions
  - Overbroad rewrites
  - Unrelated file changes
  - Missing README updates for changed behavior
- Request revisions for blocking issues.
- After blocking issues are fixed, confirm the final state and stage the approved files.

Severity guide:
- P0: App cannot generate/export/share QR codes, or a core flow is unusable.
- P1: Major visual or UX regression affecting common use, especially on mobile.
- P2: Noticeable quality, accessibility, or clarity issue that should be fixed before handoff if practical.
- P3: Polish issue or follow-up idea that should not block the repair pass.

Prioritization rubric:
Score each fix candidate from 1-5:
- User impact: How many real users or common flows benefit?
- Regression severity: How clearly does this repair a quality decline?
- Accessibility benefit: Does this improve keyboard, screen reader, contrast, focus, or mobile/touch usage?
- Implementation fit: Does it fit the existing static app architecture?
- Risk: Reverse scored; 5 means low risk, 1 means high risk.

Process:
1. Visual Regression Auditor and UX Flow Auditor inspect independently first.
2. Combine findings into one ranked issue list.
3. Technical Root-Cause Investigator maps issues to specific fixes.
4. The team agrees on the smallest coherent implementation scope.
5. Implementation Agent makes the changes.
6. QA runs visual and functional verification.
7. Code Review inspects the diff and requests revisions.
8. Implementation fixes all blocking review and QA issues.
9. QA reruns affected checks.
10. Repository Steward stages the final approved changes and reports the result.

Deliverables:
- Ranked regression issue list with severity and evidence.
- Fix plan with affected files and acceptance criteria.
- Implemented code changes.
- README update if behavior changes.
- QA checklist with viewport and functional pass/fail results.
- Code review notes and resolved issues.
- Final summary:
  - What visual and UX regressions were fixed
  - Files changed
  - Verification performed
  - Known limitations or follow-up ideas

Definition of done:
- The app works by opening index.html directly in a browser.
- Existing features still work.
- Normal mode and share mode are visually coherent on desktop and mobile.
- No text, controls, or QR output overlap or clip in tested viewports.
- QR preview remains stable and scannable-looking while settings change.
- Keyboard navigation and focus visibility are acceptable.
- Clipboard/download/share flows either work or show clear fallback feedback.
- No unnecessary dependencies, generated artifacts, or unrelated refactors are added.
- Final approved changes are staged in git.
```

