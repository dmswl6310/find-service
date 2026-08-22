export const MAP_DOMAIN_COLORS = {
  origin: { fill: "#397C8A", stroke: "#235965" },
  candidate: { fill: "#B9604B", stroke: "#843E30" },
} as const;

export const ROUTE_VISUALS = {
  walk: { colorToken: "--text-muted", opacity: 0.8, weight: 4, style: "shortdash" },
  bus: { colorToken: "--success", opacity: 0.9, weight: 5, style: "solid" },
  subway: { colorToken: "--origin", opacity: 0.9, weight: 5, style: "solid" },
} as const;

export type MapMarkerKind = keyof typeof MAP_DOMAIN_COLORS;
export type MapMarkerState = "default" | "active" | "dimmed";
export type MapMarkerImage = {
  src: string;
  size: { width: number; height: number };
  options?: {
    offset: { x: number; y: number };
  };
};

const MARKER_SIZES = {
  origin: {
    default: { width: 34, height: 34 },
    active: { width: 40, height: 40 },
    dimmed: { width: 32, height: 32 },
  },
  candidate: {
    default: { width: 36, height: 44 },
    active: { width: 42, height: 50 },
    dimmed: { width: 34, height: 42 },
  },
} as const;

function toCandidateLabel(order: number) {
  let value = Math.max(1, Math.trunc(order));
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}

function buildOriginMarker(order: number, width: number, height: number, opacity: number) {
  const palette = MAP_DOMAIN_COLORS.origin;
  const center = width / 2;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <g opacity="${opacity}">
        <circle cx="${center}" cy="${height / 2}" r="${Math.min(width, height) / 2 - 2}" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2"/>
        <text x="${center}" y="${height / 2 + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="white">${Math.max(1, Math.trunc(order))}</text>
      </g>
    </svg>
  `.trim();
}

function buildCandidateMarker(order: number, width: number, height: number, opacity: number) {
  const palette = MAP_DOMAIN_COLORS.candidate;
  const bodyHeight = height - 9;
  const center = width / 2;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <g opacity="${opacity}">
        <path d="M${center - 5} ${bodyHeight - 1} L${center} ${height - 2} L${center + 5} ${bodyHeight - 1} Z" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="2" y="2" width="${width - 4}" height="${bodyHeight - 2}" rx="9" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2"/>
        <text x="${center}" y="${bodyHeight / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="white">${toCandidateLabel(order)}</text>
      </g>
    </svg>
  `.trim();
}

export function createMapMarkerImage(
  kind: MapMarkerKind,
  order: number,
  state: MapMarkerState,
): MapMarkerImage {
  const size = MARKER_SIZES[kind][state];
  const opacity = state === "dimmed" ? 0.48 : 1;
  const svg = kind === "origin"
    ? buildOriginMarker(order, size.width, size.height, opacity)
    : buildCandidateMarker(order, size.width, size.height, opacity);

  return {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    size: { ...size },
    options: kind === "origin"
      ? { offset: { x: size.width / 2, y: size.height / 2 } }
      : undefined,
  };
}
