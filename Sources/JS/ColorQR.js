document.getElementById("generateBtn").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value.trim();
  const primaryColor = document.getElementById("primaryColor").value;
  const secondaryColor = document.getElementById("secondaryColor").value;
  const useBorder = document.getElementById("borderToggle").checked;

  if (!url) return;

  const canvas = document.getElementById("qrCode");
  const qrContainer = document.getElementById("qrContainer");
  const downloadBtn = document.getElementById("downloadBtn");

  qrContainer.classList.remove("hidden");
  downloadBtn.classList.add("hidden");

  await QRCode.toCanvas(canvas, url, {
    margin: useBorder ? 1 : 0,
    color: {
      dark: primaryColor,
      light: secondaryColor,
    },
    width: 256
  });

  downloadBtn.classList.remove("hidden");
  const filename = `ColorQR_${url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  downloadBtn.href = canvas.toDataURL("image/png");
  downloadBtn.download = filename;
});

const colorInputs = document.querySelectorAll('input[type="color"]');
colorInputs.forEach((picker) => {
  const textInput = picker.nextElementSibling;
  if (textInput && textInput.tagName === 'INPUT') {
    textInput.classList.add('color-value');

    const updateColor = () => {
      const color = picker.value;
      textInput.style.backgroundColor = color;

      const r = parseInt(color.substr(1, 2), 16);
      const g = parseInt(color.substr(3, 2), 16);
      const b = parseInt(color.substr(5, 2), 16);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      textInput.style.color = luminance > 150 ? '#000' : '#fff';
    };

    updateColor();
    picker.addEventListener('input', () => {
      textInput.value = picker.value;
      updateColor();
    });

    textInput.addEventListener('input', () => {
      picker.value = textInput.value;
      updateColor();
    });
  }
});

textInput.classList.toggle('dark', color !== "#ffffff");
textInput.classList.toggle('light', color === "#ffffff");
