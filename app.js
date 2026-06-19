(function () {
  const input = document.getElementById("qrInput");
  const qrCode = document.getElementById("qrCode");
  const statLine = document.getElementById("statLine");
  const message = document.getElementById("message");
  const sizeInput = document.getElementById("sizeInput");
  const sizeOutput = document.getElementById("sizeOutput");
  const marginInput = document.getElementById("marginInput");
  const marginOutput = document.getElementById("marginOutput");
  const foregroundInput = document.getElementById("foregroundInput");
  const backgroundInput = document.getElementById("backgroundInput");
  const sampleButton = document.getElementById("sampleButton");
  const clearButton = document.getElementById("clearButton");
  const downloadSvgButton = document.getElementById("downloadSvgButton");
  const downloadPngButton = document.getElementById("downloadPngButton");

  const sampleText = "https://github.com/new";
  let currentSvg = "";
  let currentFilename = "qr-code";

  function selectedEcc() {
    return document.querySelector("input[name='ecc']:checked").value;
  }

  function byteLength(value) {
    return new TextEncoder().encode(value).length;
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
      qrCode.innerHTML = "";
      statLine.textContent = "No text";
      message.textContent = "";
      message.classList.remove("error");
      downloadSvgButton.disabled = true;
      downloadPngButton.disabled = true;
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
      downloadSvgButton.disabled = false;
      downloadPngButton.disabled = false;
    } catch (error) {
      currentSvg = "";
      qrCode.innerHTML = "";
      statLine.textContent = "Too much data";
      message.textContent = "Reduce the text length or choose a lower correction level.";
      message.classList.add("error");
      downloadSvgButton.disabled = true;
      downloadPngButton.disabled = true;
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

  function downloadPng() {
    if (!currentSvg) return;

    const size = Number(sizeInput.value);
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
        if (blob) downloadBlob(blob, `${currentFilename}.png`);
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      message.textContent = "PNG export failed.";
      message.classList.add("error");
    };

    image.src = url;
  }

  input.addEventListener("input", render);
  sizeInput.addEventListener("input", render);
  marginInput.addEventListener("input", render);
  foregroundInput.addEventListener("input", render);
  backgroundInput.addEventListener("input", render);
  document.querySelectorAll("input[name='ecc']").forEach((radio) => {
    radio.addEventListener("change", render);
  });
  sampleButton.addEventListener("click", () => {
    input.value = sampleText;
    input.focus();
    render();
  });
  clearButton.addEventListener("click", () => {
    input.value = "";
    input.focus();
    render();
  });
  downloadSvgButton.addEventListener("click", downloadSvg);
  downloadPngButton.addEventListener("click", downloadPng);

  render();
})();
