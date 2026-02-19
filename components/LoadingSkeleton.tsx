"use client";

export function LoadingSkeleton() {
  return (
    <div className="space-y-5 p-1">
      {/* AI thinking indicator */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-20 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-500" />
        </div>
        <span
          style={{ color: "#94a3b8", fontSize: "0.8125rem", fontWeight: 500 }}
        >
          AI analyzing your campaign data…
        </span>
      </div>

      {/* Summary block */}
      <div className="space-y-2">
        <div className="shimmer h-3.5 w-20" />
        <div className="shimmer h-5 w-full" />
        <div className="shimmer h-5 w-3/4" />
      </div>

      {/* Bottleneck cards */}
      <div
        style={{
          borderTop: "1px solid var(--border-2)",
          paddingTop: "1.25rem",
        }}
      >
        <div className="shimmer h-3.5 w-24 mb-4" />
        <div className="space-y-3">
          {[0.9, 0.7, 0.55].map((opacity, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface-b)",
                borderRadius: "10px",
                padding: "0.875rem",
                opacity,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="shimmer h-4 w-28 rounded-full" />
                <div className="shimmer h-4 w-16" />
              </div>
              <div className="space-y-1.5">
                <div className="shimmer h-3 w-full" />
                <div className="shimmer h-3 w-5/6" />
                {i === 0 && <div className="shimmer h-3 w-4/5" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline skeleton */}
      <div
        style={{
          borderTop: "1px solid var(--border-2)",
          paddingTop: "1.25rem",
        }}
      >
        <div className="shimmer h-3.5 w-32 mb-4" />
        <div className="shimmer h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ActionPlanSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: "var(--surface-b)",
            borderRadius: "10px",
            padding: "1rem",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="shimmer h-6 w-6 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-4 w-3/4" />
              <div className="shimmer h-3 w-full" />
              <div className="shimmer h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExperimentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: "var(--surface-b)",
            borderRadius: "12px",
            padding: "1.125rem",
          }}
        >
          <div className="shimmer h-4 w-1/2 mb-3" />
          <div className="space-y-2">
            <div className="shimmer h-3 w-full" />
            <div className="shimmer h-3 w-full" />
            <div className="shimmer h-3 w-4/5" />
          </div>
          <div className="flex gap-2 mt-3">
            <div className="shimmer h-6 w-24 rounded-full" />
            <div className="shimmer h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CreativeSkeleton() {
  return (
    <div className="space-y-4">
      {["Angles", "Hooks", "CTAs"].map((label) => (
        <div key={label}>
          <div className="shimmer h-3.5 w-16 mb-2.5" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="shimmer h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0" />
                <div
                  className="shimmer h-3 flex-1"
                  style={{ maxWidth: `${85 - i * 8}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
