import { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────
// 3D 느낌의 심볼 배지
//  - 파스텔·둥근 감성의 글로시 메달리온(구체) + 흰색 심볼
//  - 입체감: 방사형 그라데이션(좌상단 하이라이트→하단 딥) + 유광 하이라이트 + 부드러운 바닥 그림자
//  - 미획득(잠금)은 은은한 실루엣(탈채도·흐림)으로만. 압박·자물쇠 없음.
// ─────────────────────────────────────────────────────────────

type SymbolKey =
  | "clock"
  | "sun"
  | "bowl"
  | "foot"
  | "figure"
  | "droplet"
  | "heart"
  | "window"
  | "star"
  | "envelope"
  | "bubble"
  | "compass";

interface Theme {
  light: string;
  mid: string;
  deep: string;
  symbol: SymbolKey;
}

// 카테고리별 색 테마 + 심볼 (파스텔이되 그라데이션에 깊이가 남게)
const BADGE_THEME: Record<string, Theme> = {
  "rhythm-anchor": { light: "#FFE9A8", mid: "#FBC24E", deep: "#E08A24", symbol: "clock" },
  "rhythm-light": { light: "#FFF3BE", mid: "#FCD34D", deep: "#E9A21C", symbol: "sun" },
  "rhythm-meal": { light: "#FFD9B8", mid: "#F79E63", deep: "#DE7238", symbol: "bowl" },
  "self-walk": { light: "#C6F6D5", mid: "#5AD98B", deep: "#2FA85F", symbol: "foot" },
  "self-move": { light: "#B4F0DC", mid: "#41CFA6", deep: "#1F9E7E", symbol: "figure" },
  "self-hygiene": { light: "#C4E9FD", mid: "#5CBDF5", deep: "#2C8FD1", symbol: "droplet" },
  "self-emotion": { light: "#E1D8FE", mid: "#A98BF3", deep: "#7C5AD6", symbol: "heart" },
  "self-space": { light: "#CFEDE4", mid: "#6ECBB4", deep: "#3C9E88", symbol: "window" },
  "self-hobby": { light: "#FBD1E8", mid: "#F27FBD", deep: "#D2559A", symbol: "star" },
  "rel-trust": { light: "#FFD3D9", mid: "#FB8494", deep: "#E15A6E", symbol: "envelope" },
  "rel-connect": { light: "#C8DDFE", mid: "#6BA5F7", deep: "#3E79DE", symbol: "bubble" },
  "social-explore": { light: "#D0D7FE", mid: "#8B99F5", deep: "#5E6DD8", symbol: "compass" },
};

const FALLBACK: Theme = { light: "#EAE2D2", mid: "#C9BFA8", deep: "#A79B80", symbol: "star" };

function Symbol({ kind }: { kind: SymbolKey }) {
  const stroke = "#FFFFFF";
  const sw = 5;
  const common = {
    stroke,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  switch (kind) {
    case "clock":
      return (
        <g>
          <circle cx="50" cy="50" r="16" {...common} />
          <path d="M50 50 L50 40" {...common} />
          <path d="M50 50 L58 54" {...common} />
        </g>
      );
    case "sun":
      return (
        <g>
          <circle cx="50" cy="50" r="10" fill={stroke} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = 50 + Math.cos(a) * 17;
            const y1 = 50 + Math.sin(a) * 17;
            const x2 = 50 + Math.cos(a) * 23;
            const y2 = 50 + Math.sin(a) * 23;
            return <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} {...common} />;
          })}
        </g>
      );
    case "bowl":
      return (
        <g>
          {/* 김 세 줄기 */}
          <path d="M43 33 q4 -4 0 -9" {...common} />
          <path d="M50 31 q4 -4 0 -9" {...common} />
          <path d="M57 33 q4 -4 0 -9" {...common} />
          {/* 그릇 */}
          <path d="M31 51 Q50 71 69 51" {...common} />
          <path d="M31 51 A19 6 0 0 1 69 51" {...common} />
          <path d="M44 68 L56 68" {...common} />
        </g>
      );
    case "foot":
      return (
        <g fill={stroke}>
          {/* 발바닥 (하나로 이어진 실루엣) */}
          <path d="M50 42 C56 42 58 49 57 55 C56 63 54 69 50 69 C46 69 44 63 43 55 C42 49 44 42 50 42 Z" />
          {/* 발가락 */}
          <circle cx="42" cy="38" r="2.6" />
          <circle cx="47.5" cy="35.3" r="2.9" />
          <circle cx="53" cy="35.3" r="2.9" />
          <circle cx="58" cy="38.5" r="2.4" />
        </g>
      );
    case "figure":
      return (
        <g>
          <circle cx="50" cy="34" r="6" fill={stroke} />
          <path d="M50 42 L50 56" {...common} />
          <path d="M50 46 L40 39" {...common} />
          <path d="M50 46 L60 39" {...common} />
          <path d="M50 56 L42 67" {...common} />
          <path d="M50 56 L58 67" {...common} />
        </g>
      );
    case "droplet":
      return (
        <g>
          <path d="M50 32 C59 46 59 55 50 61 C41 55 41 46 50 32 Z" fill={stroke} />
          <path d="M66 34 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill={stroke} />
        </g>
      );
    case "heart":
      return (
        <path
          d="M50 64 C34 52 36 38 47 44 Q50 46 50 49 Q50 46 53 44 C64 38 66 52 50 64 Z"
          fill={stroke}
        />
      );
    case "window":
      return (
        <g>
          <rect x="36" y="36" width="28" height="28" rx="5" {...common} />
          <path d="M50 36 L50 64" {...common} />
          <path d="M36 50 L64 50" {...common} />
        </g>
      );
    case "star":
      return (
        <path
          d="M50 30 L56 44 L71 45 L59 55 L63 70 L50 61 L37 70 L41 55 L29 45 L44 44 Z"
          fill={stroke}
        />
      );
    case "envelope":
      return (
        <g>
          <rect x="33" y="39" width="34" height="24" rx="4" {...common} />
          <path d="M34 42 L50 54 L66 42" {...common} />
        </g>
      );
    case "bubble":
      return (
        <g>
          <path
            d="M35 38 h30 a6 6 0 0 1 6 6 v12 a6 6 0 0 1 -6 6 h-14 l-8 8 v-8 h-8 a6 6 0 0 1 -6 -6 v-12 a6 6 0 0 1 6 -6 z"
            fill={stroke}
          />
        </g>
      );
    case "compass":
      return (
        <g>
          <circle cx="50" cy="50" r="17" {...common} />
          <path d="M50 40 L55 50 L50 60 L45 50 Z" fill={stroke} />
        </g>
      );
    default:
      return null;
  }
}

export function BadgeIcon({
  categoryId,
  size = 64,
  earned = true,
  className,
}: {
  categoryId: string;
  size?: number;
  earned?: boolean;
  className?: string;
}) {
  const theme = BADGE_THEME[categoryId] ?? FALLBACK;
  const uid = `badge-${categoryId}`;

  const svg: ReactNode = (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${uid}-fill`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor={theme.light} />
          <stop offset="55%" stopColor={theme.mid} />
          <stop offset="100%" stopColor={theme.deep} />
        </radialGradient>
        <radialGradient id={`${uid}-gloss`} cx="35%" cy="24%" r="42%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="50" cy="91" rx="27" ry="5" fill="#4B3E2F" opacity="0.1" />
      {/* 구체 */}
      <circle cx="50" cy="47" r="40" fill={`url(#${uid}-fill)`} />
      {/* 테두리 살짝 안쪽 라인으로 입체 강조 */}
      <circle cx="50" cy="47" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* 유광 하이라이트 */}
      <ellipse cx="38" cy="30" rx="22" ry="15" fill={`url(#${uid}-gloss)`} />
      {/* 심볼 */}
      <g transform="translate(0 -3)">
        <Symbol kind={theme.symbol} />
      </g>
    </svg>
  );

  if (!earned) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, filter: "grayscale(1) opacity(0.32) blur(0.4px)" }}
        aria-hidden
      >
        {svg}
      </div>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      {svg}
    </div>
  );
}
