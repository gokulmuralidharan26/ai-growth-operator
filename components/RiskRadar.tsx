"use client";

import { useEffect, useState } from "react";
import type { Risk } from "@/lib/schema";

interface RiskRadarProps {
  risk: Risk;
}

const RISK_LEVELS = [
  { max: 30, label: "Low Risk", color: "#10b981", glow: "rgba(16,185,129,0.35)", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  { max: 60, label: "Medium Risk", color: "#f59e0b", glow: "rgba(245,158,11,0.35)", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  { max: 100, label: "High Risk", color: "#f87171", glow: "rgba(248,113,113,0.35)", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
] as const;

function getRiskLevel(score: number) {
  return RISK_LEVELS.find((l) => score <= l.max) ?? RISK_LEVELS[2];
}

export function RiskRadar({ risk }: RiskRadarProps) {
  const [animated, setAnimated] = useState(false);
  const level = getRiskLevel(risk.riskScore);
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (circumference * risk.riskScore) / 100;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, [risk.riskScore]);

  return (
    <div
      className="fade-in-up"
      style={{
        background: level.bg,
        border: `1px solid ${level.border}`,
        borderRadius: "12px",
        padding: "1rem 1.125rem",
        marginTop: "1.25rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <div>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: level.color,
              margin: "0 0 0.25rem",
            }}
          >
            Risk Radar
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.15rem 0.5rem",
              borderRadius: "9999px",
              background: `${level.color}18`,
              border: `1px solid ${level.color}35`,
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: level.color,
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: level.color,
                boxShadow: `0 0 6px ${level.glow}`,
              }}
            />
            {level.label}
          </span>
        </div>

        {/* Circular gauge */}
        <div style={{ position: "relative", width: "64px", height: "64px" }}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--surface-d)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={level.color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={animated ? dashOffset : circumference}
              style={{
                transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)",
                filter: `drop-shadow(0 0 4px ${level.glow})`,
              }}
            />
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
            <span style={{ fontSize: "1rem", fontWeight: 700, color: level.color, lineHeight: 1 }}>
              {risk.riskScore}
            </span>
            <span style={{ fontSize: "0.5rem", color: "var(--fg3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              /100
            </span>
          </div>
        </div>
      </div>

      {/* Risk drivers */}
      {risk.riskDrivers.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {risk.riskDrivers.map((driver, i) => (
            <li
              key={i}
              style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
            >
              <span
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: level.color,
                  flexShrink: 0,
                  marginTop: "6px",
                }}
              />
              <span style={{ fontSize: "0.8125rem", color: "var(--fg2)", lineHeight: 1.55 }}>
                {driver}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
