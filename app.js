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
  const wifiSharePassword = document.getElementById("wifiSharePassword");
  const wifiSecurity = document.getElementById("wifiSecurity");
  const wifiHidden = document.getElementById("wifiHidden");
  const sizeInput = document.getElementById("sizeInput");
  const sizePresetInputs = Array.from(document.querySelectorAll("input[name='sizePreset']"));
  const marginInput = document.getElementById("marginInput");
  const marginOutput = document.getElementById("marginOutput");
  const foregroundInput = document.getElementById("foregroundInput");
  const backgroundInput = document.getElementById("backgroundInput");
  const transparentBackgroundInput = document.getElementById("transparentBackgroundInput");
  const exampleButton = document.getElementById("exampleButton");
  const shareViewButton = document.getElementById("shareViewButton");
  const clearButton = document.getElementById("clearButton");
  const copyImageButton = document.getElementById("copyImageButton");
  const downloadSvgButton = document.getElementById("downloadSvgButton");
  const downloadPngButton = document.getElementById("downloadPngButton");
  const shareActions = document.getElementById("shareActions");
  const editSharedButton = document.getElementById("editSharedButton");
  const makeYourOwnButton = document.getElementById("makeYourOwnButton");
  const shareUrlInput = document.getElementById("shareUrlInput");
  const qrInputHelp = document.getElementById("qrInputHelp");
  const shareUrlHelp = document.getElementById("shareUrlHelp");

  const exampleText = "https://example.com";
  const maxShareUrlLength = 6000;
  const settingParamNames = ["ecc", "size", "margin", "fg", "bg", "transparent"];
  const contentTypeParamName = "type";
  const contentTypeValues = Array.from(contentType.options).map((option) => option.value);
  const contentParamNames = [
    "url",
    "email",
    "subject",
    "body",
    "phone",
    "smsPhone",
    "smsMessage",
    "wifiSsid",
    "wifiPassword",
    "wifiSharePassword",
    "wifiSecurity",
    "wifiHidden"
  ];
  const minSize = Number(sizeInput.min);
  const maxSize = Number(sizeInput.max);
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
    wifiSharePassword,
    wifiSecurity,
    wifiHidden
  ];
  let currentSvg = "";
  let currentFilename = "qr-code";
  let pendingFrame = null;
  let pendingSyncOptions = null;
  let exportInProgress = false;
  let lastContentType = contentType.value;

  restoreSettings(urlState);
  restoreContentType(urlState);
  lastContentType = contentType.value;

  if (restoreContentParams(urlState)) {
    input.value = buildTemplateText();
  } else if (startingText !== null) {
    input.value = startingText;
    restoreTemplateFields(contentType.value, startingText);
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

  function currentSize() {
    return clampNumber(sizeInput.value, minSize, maxSize) || 512;
  }

  function setSize(value) {
    const size = Math.round(clampNumber(value, minSize, maxSize) || 512);
    sizeInput.value = String(size);
    sizePresetInputs.forEach((control) => {
      control.checked = Number(control.value) === size;
    });
    return size;
  }

  function restoreSettings(url) {
    const ecc = url.searchParams.get("ecc");
    const size = clampNumber(url.searchParams.get("size"), Number(sizeInput.min), Number(sizeInput.max));
    const margin = clampNumber(url.searchParams.get("margin"), Number(marginInput.min), Number(marginInput.max));
    const foreground = normalizeHexColor(url.searchParams.get("fg"));
    const background = normalizeHexColor(url.searchParams.get("bg"));
    const transparent = url.searchParams.get("transparent");

    if (["L", "M", "Q", "H"].includes(ecc)) {
      document.querySelector(`input[name='ecc'][value='${ecc}']`).checked = true;
    }

    if (size !== null) {
      setSize(size);
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

    transparentBackgroundInput.checked = transparent === "1" || transparent === "true";
  }

  function restoreContentType(url) {
    const type = url.searchParams.get(contentTypeParamName);

    if (contentTypeValues.includes(type)) {
      contentType.value = type;
    }
  }

  function restoreTemplateFields(type, value) {
    switch (type) {
      case "url":
        urlValue.value = value;
        break;
      case "email":
        restoreEmailFields(value);
        break;
      case "phone":
        phoneNumber.value = value.replace(/^tel:/i, "");
        break;
      case "sms":
        restoreSmsFields(value);
        break;
      case "wifi":
        restoreWifiFields(value);
        break;
    }
  }

  function restoreContentParams(url) {
    if (!hasContentParams(url, contentType.value)) {
      return false;
    }

    switch (contentType.value) {
      case "url":
        urlValue.value = url.searchParams.get("url") || "";
        return true;
      case "email":
        emailAddress.value = url.searchParams.get("email") || "";
        emailSubject.value = url.searchParams.get("subject") || "";
        emailBody.value = url.searchParams.get("body") || "";
        return true;
      case "phone":
        phoneNumber.value = url.searchParams.get("phone") || "";
        return true;
      case "sms":
        smsNumber.value = url.searchParams.get("smsPhone") || "";
        smsMessage.value = url.searchParams.get("smsMessage") || "";
        return true;
      case "wifi":
        wifiSsid.value = url.searchParams.get("wifiSsid") || "";
        wifiPassword.value = url.searchParams.get("wifiPassword") || "";
        wifiSharePassword.checked = url.searchParams.has("wifiPassword") || ["1", "true"].includes(url.searchParams.get("wifiSharePassword"));
        wifiSecurity.value = validWifiSecurity(url.searchParams.get("wifiSecurity"));
        wifiHidden.checked = ["1", "true"].includes(url.searchParams.get("wifiHidden"));
        return true;
      default:
        return false;
    }
  }

  function hasContentParams(url, type) {
    return contentParamNamesForType(type).some((name) => url.searchParams.has(name));
  }

  function contentParamNamesForType(type) {
    switch (type) {
      case "url":
        return ["url"];
      case "email":
        return ["email", "subject", "body"];
      case "phone":
        return ["phone"];
      case "sms":
        return ["smsPhone", "smsMessage"];
      case "wifi":
        return ["wifiSsid", "wifiPassword", "wifiSharePassword", "wifiSecurity", "wifiHidden"];
      default:
        return [];
    }
  }

  function validWifiSecurity(value) {
    return ["WPA", "WEP", "nopass"].includes(value) ? value : "WPA";
  }

  function restoreEmailFields(value) {
    if (!value.toLowerCase().startsWith("mailto:")) {
      emailAddress.value = value;
      return;
    }

    const withoutScheme = value.slice(7);
    const [address, query = ""] = withoutScheme.split("?");
    const params = new URLSearchParams(query);
    emailAddress.value = decodeURIComponent(address);
    emailSubject.value = params.get("subject") || "";
    emailBody.value = params.get("body") || "";
  }

  function restoreSmsFields(value) {
    if (!value.toLowerCase().startsWith("sms:")) {
      smsNumber.value = value;
      return;
    }

    const withoutScheme = value.slice(4);
    const [number, query = ""] = withoutScheme.split("?");
    const params = new URLSearchParams(query);
    smsNumber.value = number;
    smsMessage.value = params.get("body") || "";
  }

  function restoreWifiFields(value) {
    if (!value.toUpperCase().startsWith("WIFI:")) {
      wifiSsid.value = value;
      return;
    }

    const fields = parseWifiFields(value.slice(5));
    wifiSecurity.value = fields.T || "WPA";
    wifiSsid.value = fields.S || "";
    wifiPassword.value = fields.P || "";
    wifiSharePassword.checked = Boolean(fields.P);
    wifiHidden.checked = fields.H === "true";
  }

  function parseWifiFields(value) {
    const fields = {};
    let key = "";
    let fieldValue = "";
    let readingKey = true;
    let escaping = false;

    for (const char of value) {
      if (escaping) {
        fieldValue += char;
        escaping = false;
        continue;
      }

      if (!readingKey && char === "\\") {
        escaping = true;
        continue;
      }

      if (readingKey && char === ":") {
        readingKey = false;
        continue;
      }

      if (!readingKey && char === ";") {
        if (key) {
          fields[key] = fieldValue;
        }

        key = "";
        fieldValue = "";
        readingKey = true;
        continue;
      }

      if (readingKey) {
        key += char;
      } else {
        fieldValue += char;
      }
    }

    return fields;
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
    url.searchParams.set("size", String(currentSize()));
    url.searchParams.set("margin", marginInput.value);
    url.searchParams.set("fg", foregroundInput.value);
    url.searchParams.set("bg", backgroundInput.value);

    if (transparentBackgroundInput.checked) {
      url.searchParams.set("transparent", "1");
    }
  }

  function setContentTypeParam(url) {
    if (contentType.value === "text") {
      url.searchParams.delete(contentTypeParamName);
      return;
    }

    url.searchParams.set(contentTypeParamName, contentType.value);
  }

  function setOptionalParam(url, name, value) {
    const normalized = typeof value === "string" ? value.trim() : value;

    if (normalized) {
      url.searchParams.set(name, normalized);
    }
  }

  function setContentParams(url, options = {}) {
    const includeSensitive = options.includeSensitive !== false;
    contentParamNames.forEach((name) => {
      url.searchParams.delete(name);
    });

    switch (contentType.value) {
      case "url":
        setOptionalParam(url, "url", urlValue.value);
        break;
      case "email":
        setOptionalParam(url, "email", emailAddress.value);
        setOptionalParam(url, "subject", emailSubject.value);
        setOptionalParam(url, "body", emailBody.value);
        break;
      case "phone":
        setOptionalParam(url, "phone", phoneNumber.value);
        break;
      case "sms":
        setOptionalParam(url, "smsPhone", smsNumber.value);
        setOptionalParam(url, "smsMessage", smsMessage.value);
        break;
      case "wifi":
        setOptionalParam(url, "wifiSsid", wifiSsid.value);
        if (wifiSharePassword.checked) {
          url.searchParams.set("wifiSharePassword", "1");
        }

        if (includeSensitive && wifiSharePassword.checked) {
          setOptionalParam(url, "wifiPassword", wifiPassword.value);
        }

        url.searchParams.set("wifiSecurity", wifiSecurity.value);

        if (wifiHidden.checked) {
          url.searchParams.set("wifiHidden", "1");
        }
        break;
    }
  }

  function hasSettingParams(url) {
    return settingParamNames.some((name) => url.searchParams.has(name));
  }

  function shouldIncludeSensitiveShareData(options = {}) {
    if (options.includeSensitive === true) {
      return true;
    }

    return !(contentType.value === "wifi" && wifiPassword.value && !wifiSharePassword.checked);
  }

  function updateUrlState(options = {}) {
    const nextUrl = new URL(window.location.href);
    const includeSensitive = shouldIncludeSensitiveShareData(options);
    const value = shareTextValue(includeSensitive);
    const mode = options.mode || nextUrl.searchParams.get("mode");
    const includeSettings = options.includeSettings || hasSettingParams(nextUrl);

    nextUrl.search = "";

    if (mode === "share") {
      nextUrl.searchParams.set("mode", "share");
    }

    if (mode === "share" || includeSettings) {
      setSettingsParams(nextUrl);
    }

    setContentTypeParam(nextUrl);
    setContentParams(nextUrl, { includeSensitive });
    setTextLast(nextUrl, value);
    window.history.replaceState(null, "", nextUrl);
    updateShareUrl();
  }

  function openFullView(options = {}) {
    const nextUrl = new URL(window.location.href);

    nextUrl.search = "";

    if (!options.reset && input.value) {
      setSettingsParams(nextUrl);
      setContentTypeParam(nextUrl);
      setContentParams(nextUrl, { includeSensitive: shouldIncludeSensitiveShareData(options) });
      setTextLast(nextUrl, shareTextValue(shouldIncludeSensitiveShareData(options)));
    }

    window.location.href = nextUrl.toString();
  }

  function shareTextValue(includeSensitive) {
    if (contentType.value === "wifi" && !includeSensitive) {
      return buildTemplateText({ includeWifiPassword: false });
    }

    return input.value;
  }

  function shareUrl(options = {}) {
    const nextUrl = new URL(window.location.href);
    const includeSensitive = shouldIncludeSensitiveShareData(options);
    const value = shareTextValue(includeSensitive);

    nextUrl.search = "";
    nextUrl.searchParams.set("mode", "share");
    setSettingsParams(nextUrl);
    setContentTypeParam(nextUrl);
    setContentParams(nextUrl, { includeSensitive });
    setTextLast(nextUrl, value);
    return nextUrl.toString();
  }

  function updateShareUrl() {
    const url = shareUrl();
    const omitsWifiPassword = contentType.value === "wifi" && Boolean(wifiPassword.value) && !wifiSharePassword.checked;
    const tooLong = url.length > maxShareUrlLength;

    shareUrlInput.value = tooLong ? "" : url;
    shareViewButton.disabled = tooLong;
    shareViewButton.title = tooLong ? "Share URL is too long to copy safely" : "";
    shareUrlHelp.textContent = shareUrlHelpText({ tooLong, omitsWifiPassword, length: url.length });
  }

  function shareUrlHelpText({ tooLong, omitsWifiPassword, length }) {
    if (tooLong) {
      return `Share URL is ${length.toLocaleString()} characters, which is too long. Shorten the content before sharing a link.`;
    }

    if (omitsWifiPassword) {
      return "Share links omit the Wi-Fi password until you explicitly include it.";
    }

    if (contentType.value === "wifi" && wifiPassword.value) {
      return "This share link includes the Wi-Fi password because you opted in.";
    }

    return "Share links preserve the current QR content and settings.";
  }

  async function copyShareLink() {
    const includeSensitive = shouldIncludeSensitiveShareData();

    const url = shareUrl({ includeSensitive });

    if (url.length > maxShareUrlLength) {
      message.textContent = "Share URL is too long. Shorten the QR content before copying a share link.";
      message.classList.add("error");
      updateShareUrl();
      return;
    }

    shareViewButton.disabled = true;
    shareViewButton.setAttribute("aria-busy", "true");
    shareViewButton.textContent = "Copying...";

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard text copy is not supported.");
      }

      await navigator.clipboard.writeText(url);
      message.textContent = includeSensitive && contentType.value === "wifi" && wifiPassword.value
        ? "Share link copied with Wi-Fi password included."
        : contentType.value === "wifi" && wifiPassword.value
          ? "Share link copied without the Wi-Fi password."
        : "Share link copied.";
      message.classList.remove("error");
    } catch (error) {
      message.textContent = "Copy was blocked. Use the share URL field below.";
      message.classList.add("error");
      window.history.replaceState(null, "", url);
    } finally {
      updateShareUrl();
      shareViewButton.removeAttribute("aria-busy");
      shareViewButton.textContent = "Copy Share Link";
    }
  }

  function setGeneratedText(value, options = {}) {
    input.value = value;
    if (options.immediate) {
      renderAndSyncUrl();
    } else {
      scheduleRenderAndSyncUrl();
    }
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

  function buildTemplateText(options = {}) {
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
        const includeWifiPassword = options.includeWifiPassword !== false;
        const password = security === "nopass" || !includeWifiPassword ? "" : wifiPassword.value;
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

  function updateTemplateVisibility(sync = true, previousType = null) {
    const isText = contentType.value === "text";
    templatePanel.hidden = isText;
    input.readOnly = !isText;
    input.classList.toggle("generated-content", !isText);
    qrInputHelp.textContent = isText
      ? "Plain text is encoded exactly as entered."
      : "Generated from the helper fields above. Edit those fields to change the QR content.";

    templateFields.forEach((group) => {
      group.hidden = group.dataset.template !== contentType.value;
    });

    if (!sync) {
      return;
    }

    if (isText) {
      scheduleRenderAndSyncUrl();
      return;
    }

    if (!templateHasInput(contentType.value) && previousType === "text" && input.value.trim()) {
      restoreTemplateFields(contentType.value, input.value);
    }

    const nextText = buildTemplateText();

    if (input.value !== nextText) {
      setGeneratedText(nextText);
    } else {
      scheduleRenderAndSyncUrl();
    }
  }

  function buildSvg(qr, options) {
    const moduleCount = qr.getModuleCount();
    const quiet = options.margin;
    const total = moduleCount + quiet * 2;
    const foreground = options.foreground;
    const background = options.background;
    const transparent = options.transparent;
    const rects = [];
    const backgroundRect = transparent ? "" : `<rect width="100%" height="100%" fill="${escapeXml(background)}"/>`;

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
      backgroundRect,
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
      button.disabled = !enabled || exportInProgress;
      button.title = title;
      button.setAttribute("aria-disabled", String(!enabled));
    });
  }

  function setExportBusy(active, label) {
    exportInProgress = active;

    copyImageButton.disabled = active || !currentSvg;
    downloadPngButton.disabled = active || !currentSvg;
    downloadSvgButton.disabled = active || !currentSvg;

    copyImageButton.textContent = active && label === "copy" ? "Copying..." : "Copy Image";
    downloadPngButton.textContent = active && label === "png" ? "Exporting..." : "Download PNG";

    if (active) {
      copyImageButton.setAttribute("aria-busy", String(label === "copy"));
      downloadPngButton.setAttribute("aria-busy", String(label === "png"));
    } else {
      copyImageButton.removeAttribute("aria-busy");
      downloadPngButton.removeAttribute("aria-busy");
    }
  }

  function scannabilityItems(value, qr) {
    const items = [];
    const transparent = transparentBackgroundInput.checked;
    const ratio = contrastRatio(foregroundInput.value, backgroundInput.value);
    const foregroundLum = relativeLuminance(hexToRgb(foregroundInput.value));
    const backgroundLum = transparent ? null : relativeLuminance(hexToRgb(backgroundInput.value));
    const margin = Number(marginInput.value);
    const bytes = byteLength(value);

    if (transparent) {
      items.push({
        type: "warn",
        text: "Transparent exports depend on the surface behind the QR. Place on a plain, high-contrast background."
      });
    } else if (foregroundLum >= backgroundLum) {
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

    if (bytes > 1200) {
      items.push({
        type: "warn",
        text: "Large payload: use a larger export size, keep high contrast, and test scanning before printing."
      });
    } else {
      items.push({
        type: "ok",
        text: "Payload density is comfortable for most cameras."
      });
    }

    if (selectedEcc() === "L") {
      items.push({
        type: "warn",
        text: "Low correction fits more data but is less tolerant of damage. Use Medium or High for print."
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
    const size = setSize(sizeInput.value);
    const margin = Number(marginInput.value);

    marginOutput.value = margin;
    currentFilename = safeFilename(trimmed);
    backgroundInput.disabled = transparentBackgroundInput.checked;
    backgroundInput.setAttribute("aria-disabled", String(transparentBackgroundInput.checked));

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
        background: backgroundInput.value,
        transparent: transparentBackgroundInput.checked
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
    message.textContent = "SVG downloaded.";
    message.classList.remove("error");
  }

  function svgToPngBlob() {
    const size = currentSize();

    return new Promise((resolve, reject) => {
      const image = new Image();
      const svgBlob = new Blob([currentSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, size, size);
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
    if (!currentSvg || exportInProgress) return;

    setExportBusy(true, "png");

    try {
      const blob = await svgToPngBlob();
      downloadBlob(blob, `${currentFilename}.png`);
      message.textContent = "PNG downloaded.";
      message.classList.remove("error");
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("error");
    } finally {
      setExportBusy(false);
    }
  }

  async function copyImage() {
    if (!currentSvg || exportInProgress) return;

    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      message.textContent = "Image clipboard copy is not supported in this browser. Download PNG instead.";
      message.classList.add("error");
      return;
    }

    setExportBusy(true, "copy");

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
      setExportBusy(false);
    }
  }

  function renderAndSyncUrl(options = {}) {
    render();
    updateUrlState(options);
  }

  function scheduleRenderAndSyncUrl(options = {}) {
    pendingSyncOptions = Object.assign({}, pendingSyncOptions || {}, options);

    if (pendingFrame !== null) {
      return;
    }

    pendingFrame = window.requestAnimationFrame(() => {
      const syncOptions = pendingSyncOptions || {};
      pendingFrame = null;
      pendingSyncOptions = null;
      renderAndSyncUrl(syncOptions);
    });
  }

  input.addEventListener("input", () => {
    if (contentType.value === "text") {
      scheduleRenderAndSyncUrl();
    }
  });
  contentType.addEventListener("change", () => {
    const previousType = lastContentType;
    updateTemplateVisibility(true, previousType);
    lastContentType = contentType.value;
  });
  templateInputs.forEach((control) => {
    control.addEventListener("input", syncTemplateText);
    control.addEventListener("change", syncTemplateText);
  });
  sizePresetInputs.forEach((control) => {
    control.addEventListener("change", () => {
      setSize(control.value);
      scheduleRenderAndSyncUrl({ includeSettings: true });
    });
  });
  sizeInput.addEventListener("input", () => {
    sizePresetInputs.forEach((control) => {
      control.checked = Number(control.value) === Number(sizeInput.value);
    });

    if (sizeInput.value !== "" && sizeInput.validity.valid) {
      scheduleRenderAndSyncUrl({ includeSettings: true });
    }
  });
  sizeInput.addEventListener("change", () => {
    setSize(sizeInput.value);
    scheduleRenderAndSyncUrl({ includeSettings: true });
  });
  marginInput.addEventListener("input", () => scheduleRenderAndSyncUrl({ includeSettings: true }));
  foregroundInput.addEventListener("input", () => scheduleRenderAndSyncUrl({ includeSettings: true }));
  backgroundInput.addEventListener("input", () => scheduleRenderAndSyncUrl({ includeSettings: true }));
  transparentBackgroundInput.addEventListener("change", () => scheduleRenderAndSyncUrl({ includeSettings: true }));
  document.querySelectorAll("input[name='ecc']").forEach((radio) => {
    radio.addEventListener("change", () => scheduleRenderAndSyncUrl({ includeSettings: true }));
  });
  exampleButton.addEventListener("click", () => {
    contentType.value = "text";
    updateTemplateVisibility();
    input.value = exampleText;
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
