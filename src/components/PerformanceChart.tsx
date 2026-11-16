export function PerformanceChart() {
  return (
    <div className="chart-wrap">
      <div className="chart-y">
        <span>6k</span>
        <span>4k</span>
        <span>2k</span>
        <span>0</span>
      </div>
      <svg
        className="chart"
        viewBox="0 0 690 180"
        preserveAspectRatio="none"
        aria-label="Campaign performance trend"
      >
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6854d9" stopOpacity=".18" />
            <stop offset="100%" stopColor="#6854d9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 133 C35 128 45 105 76 111 S120 135 150 106 S195 65 225 85 S270 119 300 79 S342 53 375 67 S418 104 450 73 S496 40 525 61 S570 94 600 49 S653 61 690 18 L690 180 L0 180Z"
          fill="url(#area)"
        />
        <path
          d="M0 133 C35 128 45 105 76 111 S120 135 150 106 S195 65 225 85 S270 119 300 79 S342 53 375 67 S418 104 450 73 S496 40 525 61 S570 94 600 49 S653 61 690 18"
          fill="none"
          stroke="#7460e7"
          strokeWidth="3"
        />
        <path
          d="M0 157 C40 152 47 143 76 149 S122 158 150 142 S193 127 225 133 S271 152 300 131 S344 122 375 128 S419 143 450 131 S495 117 525 127 S570 136 600 115 S653 125 690 98"
          fill="none"
          stroke="#f3a36f"
          strokeWidth="2.4"
          strokeDasharray="5 5"
        />
        <g fill="#fff" stroke="#7460e7" strokeWidth="2">
          <circle cx="150" cy="106" r="4" />
          <circle cx="300" cy="79" r="4" />
          <circle cx="450" cy="73" r="4" />
          <circle cx="600" cy="49" r="4" />
          <circle cx="690" cy="18" r="4" />
        </g>
      </svg>
    </div>
  );
}
