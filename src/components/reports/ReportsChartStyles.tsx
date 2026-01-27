export function ReportsChartStyles() {
  return (
    <style>{`
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Disable chart selection/focus highlighting */
      .recharts-wrapper,
      .recharts-wrapper svg,
      .recharts-surface,
      .recharts-layer,
      .recharts-bar-rectangle,
      .recharts-line-curve,
      .recharts-dot {
        outline: none !important;
        cursor: default !important;
      }

      .recharts-wrapper:focus,
      .recharts-wrapper svg:focus,
      .recharts-surface:focus,
      .recharts-layer:focus {
        outline: none !important;
      }

      .recharts-wrapper *:focus {
        outline: none !important;
      }
    `}</style>
  )
}
