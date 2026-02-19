"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalysisResult, BottleneckType } from "@/lib/schema";

interface InsightTimelineProps {
  result: AnalysisResult;
}

const BOTTLENECK_CONFIG: Record<
  BottleneckType,
  { color: string; glow: string; bg: string; label: string }
> = {
  Creative: {
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.4)",
    bg: "rgba(168, 85, 247, 0.12)",
    label: "Creative",
  },
  Conversion: {
    color: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.4)",
    bg: "rgba(59, 130, 246, 0.12)",
    label: "Conversion",
  },
  Scaling: {
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.4)",
    bg: "rgba(16, 185, 129, 0.12)",
    label: "Scaling",
  },
  Efficiency: {
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.4)",
    bg: "rgba(245, 158, 11, 0.12)",
    label: "Efficiency",
  },
};

interface TooltipData {
  type: BottleneckType;
  signalStrength: number;
  reasoning: string[];
  x: number;
  y: number;
}

export function InsightTimeline({ result }: InsightTimelineProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [animated, setAnimated] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalSignal = result.bottlenecks.reduce(
    (sum, b) => sum + b.signalStrength,
    0
  );

  const segments = result.bottlenecks.map((b) => ({
    ...b,
    widthPct: totalSignal > 0 ? (b.signalStrength / totalSignal) * 100 : 0,
    config: BOTTLENECK_CONFIG[b.type],
  }));

  const primaryConfig = BOTTLENECK_CONFIG[result.primaryBottleneck];
  const confidencePct = Math.round(result.confidence * 100);
  const circumference = 2 * Math.PI * 32;
  const dashOffset = circumference - (circumference * result.confidence);

  function handleSegmentEnter(
    seg: (typeof segments)[0],
    e: React.MouseEvent<HTMLDivElement>
  ) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const barRect = barRef.current?.getBoundingClientRect();
    if (!barRect) return;
    setTooltip({
      type: seg.type,
      signalStrength: seg.signalStrength,
      reasoning: seg.reasoning,
      x: rect.left - barRect.left + rect.width / 2,
      y: rect.top - barRect.top,
    });
  }

  function handleSegmentLeave() {
    setTooltip(null);
  }

  return (
    <div className="fade-in-up" style={{ marginTop: "1.5rem" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--fg3)",
              marginBottom: "0.375rem",
            }}
          >
            Insight Timeline
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.2rem 0.625rem",
                borderRadius: "9999px",
                background: primaryConfig.bg,
                border: `1px solid ${primaryConfig.color}40`,
                fontSize: "0.75rem",
                fontWeight: 600,
                color: primaryConfig.color,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: primaryConfig.color,
                  boxShadow: `0 0 6px ${primaryConfig.glow}`,
                  flexShrink: 0,
                }}
              />
              Primary: {result.primaryBottleneck}
            </span>
            {result.secondaryBottlenecks.slice(0, 2).map((sb) => {
              const sc = BOTTLENECK_CONFIG[sb];
              return (
                <span
                  key={sb}
                  style={{
                    padding: "0.2rem 0.5rem",
                    borderRadius: "9999px",
                    background: "var(--surface-c)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    color: sc.color,
                  }}
                >
                  {sb}
                </span>
              );
            })}
          </div>
        </div>

        {/* Confidence indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ position: "relative", width: "72px", height: "72px" }}>
            <svg
              width="72"
              height="72"
              viewBox="0 0 80 80"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Track */}
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              {/* Fill */}
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke={`url(#confGrad-${result.primaryBottleneck})`}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={animated ? dashOffset : circumference}
                style={{
                  transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
              <defs>
                <linearGradient
                  id={`confGrad-${result.primaryBottleneck}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--fg1)",
                  lineHeight: 1,
                }}
              >
                {confidencePct}%
              </span>
              <span
                style={{
                  fontSize: "0.5625rem",
                  color: "var(--fg3)",
                  marginTop: "1px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                conf.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented bar */}
      <div ref={barRef} style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            gap: "3px",
            height: "36px",
            borderRadius: "10px",
            overflow: "visible",
          }}
        >
          {segments.map((seg, i) => (
            <div
              key={seg.type}
              onMouseEnter={(e) => handleSegmentEnter(seg, e)}
              onMouseLeave={handleSegmentLeave}
              style={{
                position: "relative",
                width: animated ? `${seg.widthPct}%` : "0%",
                minWidth: animated ? "2%" : "0%",
                background: `linear-gradient(135deg, ${seg.config.color}cc, ${seg.config.color}88)`,
                borderRadius:
                  i === 0
                    ? "8px 4px 4px 8px"
                    : i === segments.length - 1
                    ? "4px 8px 8px 4px"
                    : "4px",
                cursor: "pointer",
                transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                transitionDelay: `${i * 120}ms`,
                boxShadow: `0 0 12px ${seg.config.glow}`,
                border: `1px solid ${seg.config.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
              title={`${seg.type}: ${Math.round(seg.signalStrength * 100)}%`}
            >
              {seg.widthPct > 15 && (
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {seg.type}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: Math.min(
                Math.max(tooltip.x - 120, 0),
                (barRef.current?.offsetWidth ?? 400) - 240
              ),
              bottom: "calc(100% + 10px)",
              width: "240px",
              background: "var(--dropdown-bg)",
              border: `1px solid ${BOTTLENECK_CONFIG[tooltip.type].color}40`,
              borderRadius: "10px",
              padding: "0.75rem",
              zIndex: 50,
              boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${BOTTLENECK_CONFIG[tooltip.type].color}20`,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: BOTTLENECK_CONFIG[tooltip.type].color,
                }}
              >
                {tooltip.type}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--fg2)",
                }}
              >
                {Math.round(tooltip.signalStrength * 100)}% signal
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {tooltip.reasoning.slice(0, 2).map((r, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.375rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: BOTTLENECK_CONFIG[tooltip.type].color,
                      flexShrink: 0,
                      marginTop: "5px",
                    }}
                  />
                  <span style={{ fontSize: "0.6875rem", color: "var(--fg2)", lineHeight: 1.5 }}>
                    {r}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {segments.map((seg) => (
          <div
            key={seg.type}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                background: seg.config.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.6875rem", color: "var(--fg3)" }}>
              {seg.type}{" "}
              <span style={{ color: "var(--fg2)", fontWeight: 600 }}>
                {Math.round(seg.signalStrength * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
