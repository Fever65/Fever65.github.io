const ssidInput = document.getElementById('ssidInput');
const passwordInput = document.getElementById('passwordInput');
const securitySelect = document.getElementById('securitySelect');

const primaryColorInput = document.getElementById('primaryColor');
const primaryText = document.getElementById('primaryText');
const secondaryColorInput = document.getElementById('secondaryColor');
const secondaryText = document.getElementById('secondaryText');
const borderToggle = document.getElementById('borderToggle');

const qrContainer = document.getElementById('qrContainer');
const canvas = document.getElementById('qrCode');
const downloadBtn = document.getElementById('downloadBtn');

function updateColorPreview(input) {
  input.style.backgroundColor = input.value;
  input.style.color = getContrastColor(input.value);
}

function getContrastColor(hex) {
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140 ? "#000" : "#fff";
}

function isHex(value) {
  return /^#([0-9a-f]{3}){1,2}$/i.test(value);
}

primaryColorInput.addEventListener('input', () => {
  primaryText.value = primaryColorInput.value;
  updateColorPreview(primaryText);
});
primaryText.addEventListener('input', () => {
  if (isHex(primaryText.value)) {
    primaryColorInput.value = primaryText.value;
    updateColorPreview(primaryText);
  }
});
secondaryColorInput.addEventListener('input', () => {
  secondaryText.value = secondaryColorInput.value;
  updateColorPreview(secondaryText);
});
secondaryText.addEventListener('input', () => {
  if (isHex(secondaryText.value)) {
    secondaryColorInput.value = secondaryText.value;
    updateColorPreview(secondaryText);
  }
});

document.getElementById('generateBtn').addEventListener('click', () => {
  const ssid = ssidInput.value.trim();
  const password = passwordInput.value.trim();
  const security = securitySelect.value;

  if (!ssid) {
    alert("Merci de renseigner le nom du réseau Wi-Fi.");
    return;
  }

  const qrData =
    `WIFI:T:${security};S:${ssid};` +
    (security !== "nopass" ? `P:${password};` : "") +
    `;`;

  const colorDark = isHex(primaryColorInput.value) ? primaryColorInput.value : "#000000";
  const colorLight = isHex(secondaryColorInput.value) ? secondaryColorInput.value : "#ffffff";

  QRCode.toCanvas(canvas, qrData, {
    color: {
      dark: colorDark,
      light: colorLight
    },
    margin: borderToggle.checked ? 2 : 0,
    width: 300
  }, function (error) {
    if (error) {
      alert("Erreur lors de la génération du QR Code.");
      return;
    }
    qrContainer.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
  });
});

downloadBtn.addEventListener('click', () => {
  const image = canvas.toDataURL("image/png");
  downloadBtn.href = image;
});

window.addEventListener("DOMContentLoaded", () => {
  updateColorPreview(primaryText);
  updateColorPreview(secondaryText);
});
