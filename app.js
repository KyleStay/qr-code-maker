(function () {
  const input = document.getElementById("qrInput");
  const qrCode = document.getElementById("qrCode");
  const statLine = document.getElementById("statLine");
  const scanStatus = document.getElementById("scanStatus");
  const message = document.getElementById("message");
  const contentType = document.getElementById("contentType");
  const templatePanel = document.getElementById("templatePanel");
  const templateFields = Array.from(document.querySelectorAll(".template-fields"));
  const urlValue = document.getElementById("urlValue");
  const emailAddress = document.getElementById("emailAddress");
  const emailSubject = document.getElementById("emailSubject");
  const emailBody = document.getElementById("emailBody");
  const phoneNumber = document.getElementById("phoneNumber");
  const smsNumber = document.getElementById("smsNumber");
  const smsMessage = document.getElementById("smsMessage");
  const wifiSsid = document.getElementById("wifiSsid");
  const wifiPassword = document.getElementById("wifiPassword");
  const wifiSecurity = document.getElementById("wifiSecurity");
  const wifiHidden = document.getElementById("wifiHidden");
  const sizeInput = document.getElementById("sizeInput");
  const sizeOutput = document.getElementById("sizeOutput");
  const marginInput = document.getElementById("marginInput");
  const marginOutput = document.getElementById("marginOutput");
  const foregroundInput = document.getElementById("foregroundInput");
  const backgroundInput = document.getElementById("backgroundInput");
  const sampleButton = document.getElementById("sampleButton");
  const shareViewButton = document.getElementById("shareViewButton");
  const clearButton = document.getElementById("clearButton");
  const copyImageButton = document.getElementById("copyImageButton");
  const downloadSvgButton = document.getElementById("downloadSvgButton");
  const downloadPngButton = document.getElementById("downloadPngButton");
  const shareActions = document.getElementById("shareActions");
  const editSharedButton = document.getElementById("editSharedButton");
  const makeYourOwnButton = document.getElementById("makeYourOwnButton");
  const shareUrlInput = document.getElementById("shareUrlInput");

  const sampleText = "https://github.com/new";
  const settingParamNames = ["ecc", "size", "margin", "fg", "bg"];
  const urlState = new URL(window.location.href);
  const startingText = textFromUrl(urlState);
  const isShareMode = urlState.searchParams.get("mode") === "share";
  const templateInputs = [
    urlValue,
    emailAddress,
    emailSubject,
    emailBody,
    phoneNumber,
    smsNumber,
    smsMessage,
    wifiSsid,
    wifiPassword,
    wifiSecurity,
    wifiHidden
  ];
  let currentSvg = "";
  let currentFilename = "qr-code";

  restoreSettings(urlState);

  if (startingText !== null) {
    input.value = startingText;
  }

  function setShareMode(active) {
    document.body.classList.toggle("share-mode", active);
    shareActions.hidden = !active;
  }

  setShareMode(isShareMode);

  function selectedEcc() {
    return document.querySelector("input[name='ecc']:checked").value;
  }

  function byteLength(value) {
    return new TextEncoder().encode(value).length;
  }

  function clampNumber(value, min, max) {
    if (value === null || value === "") {
      return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return null;
    }

    return Math.min(max, Math.max(min, number));
  }

  function restoreSettings(url) {
    const ecc = url.searchParams.get("ecc");
    const size = clampNumber(url.searchParams.get("size"), Number(sizeInput.min), Number(sizeInput.max));
    const margin = clampNumber(url.searchParams.get("margin"), Number(marginInput.min), Number(marginInput.max));
    const foreground = normalizeHexColor(url.searchParams.get("fg"));
    const background = normalizeHexColor(url.searchParams.get("bg"));

    if (["L", "M", "Q", "H"].includes(ecc)) {
      document.querySelector(`input[name='ecc'][value='${ecc}']`).checked = true;
    }

    if (size !== null) {
      sizeInput.value = String(Math.round(size / Number(sizeInput.step)) * Number(sizeInput.step));
    }

    if (margin !== null) {
      marginInput.value = String(Math.round(margin));
    }

    if (foreground) {
      foregroundInput.value = foreground;
    }

    if (background) {
      backgroundInput.value = background;
    }
  }

  function safeFilename(value) {
    const cleaned = value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 52);

    return cleaned || "qr-code";
  }

  function escapeXml(value) {
    return String(value).replace(/[<>&"']/g, (char) => {
      return {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;"
      }[char];
    });
  }

  function textFromUrl(url) {
    return url.searchParams.has("text") ? url.searchParams.get("text") : null;
  }

  function setTextLast(url, value) {
    url.searchParams.delete("text");

    if (value) {
      url.searchParams.append("text", value);
    }
  }

  function normalizeHexColor(value) {
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : null;
  }

  function setSettingsParams(url) {
    url.searchParams.set("ecc", selectedEcc());
    url.searchParams.set("size", sizeInput.value);
    url.searchParams.set("margin", marginInput.value);
    url.searchParams.set("fg", foregroundInput.value);
    url.searchParams.set("bg", backgroundInput.value);
  }

  function hasSettingParams(url) {
    return settingParamNames.some((name) => url.searchParams.has(name));
  }

  function updateUrlState(options = {}) {
    const nextUrl = new URL(window.location.href);
    const value = input.value;
    const mode = options.mode || nextUrl.searchParams.get("mode");
    const includeSettings = options.includeSettings || hasSettingParams(nextUrl);

    nextUrl.search = "";

    if (mode === "share") {
      nextUrl.searchParams.set("mode", "share");
    }

    if (mode === "share" || includeSettings) {
      setSettingsParams(nextUrl);
    }

    setTextLast(nextUrl, value);
    window.history.replaceState(null, "", nextUrl);
    updateShareUrl();
  }

  function openFullView(options = {}) {
    const nextUrl = new URL(window.location.href);

    nextUrl.search = "";

    if (!options.reset && input.value) {
      setSettingsParams(nextUrl);
      setTextLast(nextUrl, input.value);
    }

    window.location.href = nextUrl.toString();
  }

  function shareUrl() {
    const nextUrl = new URL(window.location.href);
    const value = input.value;

    nextUrl.search = "";
    nextUrl.searchParams.set("mode", "share");
    setSettingsParams(nextUrl);
    setTextLast(nextUrl, value);
    return nextUrl.toString();
  }

  function updateShareUrl() {
    shareUrlInput.value = shareUrl();
  }

  async function copyShareLink() {
    const url = shareUrl();
    shareViewButton.disabled = true;
    shareViewButton.setAttribute("aria-busy", "true");
    shareViewButton.textContent = "Copying...";

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard text copy is not supported.");
      }

      await navigator.clipboard.writeText(url);
      message.textContent = "Share link copied.";
      message.classList.remove("error");
    } catch (error) {
      message.textContent = "Copy was blocked. Use the share URL field below.";
      message.classList.add("error");
      window.history.replaceState(null, "", url);
    } finally {
      shareViewButton.disabled = false;
      shareViewButton.removeAttribute("aria-busy");
      shareViewButton.textContent = "Copy Share Link";
    }
  }

  function setGeneratedText(value) {
    input.value = value;
    render();
    updateUrlState();
  }

  function normalizeUrl(value) {
    const trimmed = value.trim();

    if (!trimmed) {
      return "";
    }

    return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  function encodeMailQuery(params) {
    return params
      .filter((item) => item.value.trim())
      .map((item) => `${item.key}=${encodeURIComponent(item.value.trim())}`)
      .join("&");
  }

  function escapeWifiValue(value) {
    return value.replace(/([\\;,:"])/g, "\\$1");
  }

  function buildTemplateText() {
    switch (contentType.value) {
      case "url":
        return normalizeUrl(urlValue.value);
      case "email": {
        const address = emailAddress.value.trim();
        const query = encodeMailQuery([
          { key: "subject", value: emailSubject.value },
          { key: "body", value: emailBody.value }
        ]);
        return address ? `mailto:${address}${query ? `?${query}` : ""}` : "";
      }
      case "phone":
        return phoneNumber.value.trim() ? `tel:${phoneNumber.value.trim()}` : "";
      case "sms": {
        const number = smsNumber.value.trim();
        const body = smsMessage.value.trim();
        return number ? `sms:${number}${body ? `?body=${encodeURIComponent(body)}` : ""}` : "";
      }
      case "wifi": {
        const ssid = wifiSsid.value.trim();

        if (!ssid) {
          return "";
        }

        const security = wifiSecurity.value;
        const password = security === "nopass" ? "" : wifiPassword.value;
        const hidden = wifiHidden.checked ? "H:true;" : "";
        return `WIFI:T:${security};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(password)};${hidden};`;
      }
      default:
        return input.value;
    }
  }

  function syncTemplateText() {
    if (contentType.value !== "text") {
      setGeneratedText(buildTemplateText());
    }
  }

  function templateHasInput(type) {
    switch (type) {
      case "url":
        return Boolean(urlValue.value.trim());
      case "email":
        return Boolean(emailAddress.value.trim() || emailSubject.value.trim() || emailBody.value.trim());
      case "phone":
        return Boolean(phoneNumber.value.trim());
      case "sms":
        return Boolean(smsNumber.value.trim() || smsMessage.value.trim());
      case "wifi":
        return Boolean(wifiSsid.value.trim() || wifiPassword.value.trim());
      default:
        return false;
    }
  }

  function updateTemplateVisibility(sync = true) {
    const isText = contentType.value === "text";
    templatePanel.hidden = isText;
    input.readOnly = !isText;
    input.classList.toggle("generated-content", !isText);

    templateFields.forEach((group) => {
      group.hidden = group.dataset.template !== contentType.value;
    });

    if (!sync) {
      return;
    }

    if (isText || !templateHasInput(contentType.value)) {
      render();
      updateUrlState();
    } else {
      syncTemplateText();
    }
  }

  function buildSvg(qr, options) {
    const moduleCount = qr.getModuleCount();
    const quiet = options.margin;
    const total = moduleCount + quiet * 2;
    const foreground = options.foreground;
    const background = options.background;
    const rects = [];

    for (let row = 0; row < moduleCount; row += 1) {
      let start = null;

      for (let col = 0; col <= moduleCount; col += 1) {
        const dark = col < moduleCount && qr.isDark(row, col);

        if (dark && start === null) {
          start = col;
        }

        if ((!dark || col === moduleCount) && start !== null) {
          rects.push(
            `<rect x="${start + quiet}" y="${row + quiet}" width="${col - start}" height="1"/>`
          );
          start = null;
        }
      }
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Generated QR code" viewBox="0 0 ${total} ${total}" width="${options.size}" height="${options.size}" shape-rendering="crispEdges">`,
      `<rect width="100%" height="100%" fill="${escapeXml(background)}"/>`,
      `<g fill="${escapeXml(foreground)}">`,
      rects.join(""),
      "</g>",
      "</svg>"
    ].join("");
  }

  function hexToRgb(value) {
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);

    if (!match) {
      return null;
    }

    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16)
    };
  }

  function channelLuminance(channel) {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  }

  function relativeLuminance(color) {
    return (
      0.2126 * channelLuminance(color.r) +
      0.7152 * channelLuminance(color.g) +
      0.0722 * channelLuminance(color.b)
    );
  }

  function contrastRatio(foreground, background) {
    const foregroundRgb = hexToRgb(foreground);
    const backgroundRgb = hexToRgb(background);

    if (!foregroundRgb || !backgroundRgb) {
      return 1;
    }

    const foregroundLum = relativeLuminance(foregroundRgb);
    const backgroundLum = relativeLuminance(backgroundRgb);
    const light = Math.max(foregroundLum, backgroundLum);
    const dark = Math.min(foregroundLum, backgroundLum);
    return (light + 0.05) / (dark + 0.05);
  }

  function setScanStatus(items) {
    scanStatus.innerHTML = items
      .map((item) => `<li class="${item.type}">${escapeXml(item.text)}</li>`)
      .join("");
  }

  function updateActionAvailability(enabled) {
    const title = enabled ? "" : "Generate a QR code first";

    [copyImageButton, downloadSvgButton, downloadPngButton].forEach((button) => {
      button.disabled = !enabled;
      button.title = title;
      button.setAttribute("aria-disabled", String(!enabled));
    });
  }

  function scannabilityItems(value, qr) {
    const items = [];
    const ratio = contrastRatio(foregroundInput.value, backgroundInput.value);
    const foregroundLum = relativeLuminance(hexToRgb(foregroundInput.value));
    const backgroundLum = relativeLuminance(hexToRgb(backgroundInput.value));
    const margin = Number(marginInput.value);
    const bytes = byteLength(value);

    if (foregroundLum >= backgroundLum) {
      items.push({
        type: "warn",
        text: "Use a darker QR foreground than background for more reliable scans."
      });
    } else if (ratio < 4.5) {
      items.push({
        type: "warn",
        text: `Low contrast (${ratio.toFixed(1)}:1) may be hard to scan.`
      });
    } else {
      items.push({
        type: "ok",
        text: `Contrast looks strong (${ratio.toFixed(1)}:1).`
      });
    }

    if (margin < 4) {
      items.push({
        type: "warn",
        text: "A margin of 4 or more is safer for printed and camera scans."
      });
    } else {
      items.push({
        type: "ok",
        text: "Quiet-zone margin is scan friendly."
      });
    }

    items.push({
      type: "ok",
      text: `${qr.getModuleCount()} modules · ${bytes} bytes · ${selectedEcc()} error correction.`
    });

    return items;
  }

  function render() {
    const value = input.value;
    const trimmed = value.trim();
    const size = Number(sizeInput.value);
    const margin = Number(marginInput.value);

    sizeOutput.value = size;
    marginOutput.value = margin;
    currentFilename = safeFilename(trimmed);

    if (!trimmed) {
      currentSvg = "";
      qrCode.innerHTML = '<div class="empty-state">Enter content to generate a QR code.</div>';
      statLine.textContent = "No text";
      message.textContent = "";
      message.classList.remove("error");
      setScanStatus([]);
      updateActionAvailability(false);
      updateShareUrl();
      return;
    }

    try {
      const qr = qrcode(0, selectedEcc());
      qr.addData(value);
      qr.make();
      currentSvg = buildSvg(qr, {
        size,
        margin,
        foreground: foregroundInput.value,
        background: backgroundInput.value
      });
      qrCode.innerHTML = currentSvg;
      statLine.textContent = `${qr.getModuleCount()} modules · ${byteLength(value)} bytes`;
      message.textContent = "";
      message.classList.remove("error");
      setScanStatus(scannabilityItems(value, qr));
      updateActionAvailability(true);
      updateShareUrl();
    } catch (error) {
      currentSvg = "";
      qrCode.innerHTML = '<div class="empty-state">The QR code cannot be generated yet.</div>';
      statLine.textContent = "Too much data";
      message.textContent = "Reduce the text length or choose a lower correction level.";
      message.classList.add("error");
      setScanStatus([]);
      updateActionAvailability(false);
      updateShareUrl();
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadSvg() {
    if (!currentSvg) return;
    downloadBlob(new Blob([currentSvg], { type: "image/svg+xml" }), `${currentFilename}.svg`);
  }

  function svgToPngBlob() {
    const size = Number(sizeInput.value);

    return new Promise((resolve, reject) => {
      const image = new Image();
      const svgBlob = new Blob([currentSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("PNG export failed."));
          }
        }, "image/png");
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("PNG export failed."));
      };

      image.src = url;
    });
  }

  async function downloadPng() {
    if (!currentSvg) return;

    try {
      const blob = await svgToPngBlob();
      downloadBlob(blob, `${currentFilename}.png`);
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("error");
    }
  }

  async function copyImage() {
    if (!currentSvg) return;

    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      message.textContent = "Image clipboard copy is not supported in this browser. Download PNG instead.";
      message.classList.add("error");
      return;
    }

    copyImageButton.disabled = true;
    copyImageButton.setAttribute("aria-busy", "true");
    copyImageButton.textContent = "Copying...";

    try {
      const blob = await svgToPngBlob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      message.textContent = "QR image copied to clipboard.";
      message.classList.remove("error");
    } catch (error) {
      message.textContent = "Clipboard copy was blocked by the browser.";
      message.classList.add("error");
    } finally {
      copyImageButton.disabled = false;
      copyImageButton.removeAttribute("aria-busy");
      copyImageButton.textContent = "Copy Image";
    }
  }

  function renderAndSyncUrl(options = {}) {
    render();
    updateUrlState(options);
  }

  input.addEventListener("input", () => {
    if (contentType.value === "text") {
      renderAndSyncUrl();
    }
  });
  contentType.addEventListener("change", updateTemplateVisibility);
  templateInputs.forEach((control) => {
    control.addEventListener("input", syncTemplateText);
    control.addEventListener("change", syncTemplateText);
  });
  sizeInput.addEventListener("input", () => renderAndSyncUrl({ includeSettings: true }));
  marginInput.addEventListener("input", () => renderAndSyncUrl({ includeSettings: true }));
  foregroundInput.addEventListener("input", () => renderAndSyncUrl({ includeSettings: true }));
  backgroundInput.addEventListener("input", () => renderAndSyncUrl({ includeSettings: true }));
  document.querySelectorAll("input[name='ecc']").forEach((radio) => {
    radio.addEventListener("change", () => renderAndSyncUrl({ includeSettings: true }));
  });
  sampleButton.addEventListener("click", () => {
    contentType.value = "text";
    updateTemplateVisibility();
    input.value = sampleText;
    input.focus();
    renderAndSyncUrl();
  });
  shareViewButton.addEventListener("click", copyShareLink);
  clearButton.addEventListener("click", () => {
    contentType.value = "text";
    updateTemplateVisibility();
    input.value = "";
    input.focus();
    renderAndSyncUrl();
  });
  copyImageButton.addEventListener("click", copyImage);
  downloadSvgButton.addEventListener("click", downloadSvg);
  downloadPngButton.addEventListener("click", downloadPng);
  editSharedButton.addEventListener("click", () => openFullView());
  makeYourOwnButton.addEventListener("click", () => openFullView({ reset: true }));

  updateTemplateVisibility(false);
  render();
})();
