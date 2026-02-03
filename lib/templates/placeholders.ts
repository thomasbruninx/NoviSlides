const placeholderSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a2333" />
      <stop offset="100%" stop-color="#36415e" />
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)" />
  <rect x="120" y="120" width="960" height="435" rx="32" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" />
  <text x="600" y="338" text-anchor="middle" font-family="'Segoe UI', Arial" font-size="48" fill="rgba(255,255,255,0.65)">Placeholder</text>
</svg>
`;

export const IMAGE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;
