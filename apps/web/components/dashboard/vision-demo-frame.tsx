/** Static 16:9 demo frame for desktop presentations without a camera. */
export const VISION_DEMO_FRAME_WIDTH = 1280
export const VISION_DEMO_FRAME_HEIGHT = 720

export function VisionDemoFrame() {
  return (
    <svg
      viewBox={`0 0 ${VISION_DEMO_FRAME_WIDTH} ${VISION_DEMO_FRAME_HEIGHT}`}
      className="h-full w-full"
      role="img"
      aria-label="Demo construction site frame"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8eb8d8" />
          <stop offset="100%" stopColor="#d8e8f0" />
        </linearGradient>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6b4a" />
          <stop offset="100%" stopColor="#5c4631" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#sky)" />
      <rect x="0" y="430" width="1280" height="290" fill="url(#soil)" />
      <rect
        x="120"
        y="300"
        width="420"
        height="180"
        fill="#6d7f86"
        opacity="0.85"
      />
      <rect x="160" y="340" width="120" height="90" fill="#4f5d63" />
      <rect x="320" y="340" width="120" height="90" fill="#4f5d63" />
      <polygon points="90,300 260,170 430,300" fill="#7a4f35" />
      <rect x="700" y="250" width="90" height="230" fill="#f0c040" />
      <rect x="820" y="360" width="280" height="24" fill="#9aa3a8" />
      <rect
        x="860"
        y="384"
        width="200"
        height="96"
        fill="#b8c0c4"
        opacity="0.9"
      />
      <rect
        x="180"
        y="500"
        width="340"
        height="18"
        fill="#3d3028"
        opacity="0.7"
      />
      <rect
        x="520"
        y="470"
        width="220"
        height="14"
        fill="#3d3028"
        opacity="0.55"
      />
      <text
        x="48"
        y="64"
        fill="#1f2933"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="28"
        fontWeight="600"
      >
        Campus West · South field
      </text>
      <text
        x="48"
        y="98"
        fill="#334155"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="18"
      >
        Demo frame for live detection
      </text>
    </svg>
  )
}
