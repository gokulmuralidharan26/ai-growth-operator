"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { CampaignSnapshotForm } from "@/components/CampaignSnapshotForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SettingsButton } from "@/components/SettingsButton";
import { ToastContainer, type ToastMessage } from "@/components/Toast";
import type {
  CampaignSnapshot,
  ComputedFields,
  AnalysisResult,
  HistoryItem,
  AnalyzeResponse,
} from "@/lib/schema";
import { loadHistory, saveToHistory, generateId } from "@/lib/utils";

export default function Page() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<CampaignSnapshot | null>(null);
  const [currentComputed, setCurrentComputed] = useState<ComputedFields | null>(null);
  const [pendingSnapshot, setPendingSnapshot] = useState<CampaignSnapshot | null>(null);
  const [pendingComputed, setPendingComputed] = useState<ComputedFields | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [experimentIds, setExperimentIds] = useState<Array<{ name: string; id: string }>>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastCounter = useRef(0);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function addToast(type: ToastMessage["type"], message: string) {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleToggleSimulation() {
    const next = !simulationMode;
    setSimulationMode(next);
    if (next) {
      addToast("sim", "Simulation Mode enabled – Using demo scenarios");
    } else {
      addToast("live", "Live Mode enabled – Real campaign inputs only");
    }
  }

  const runAnalysis = useCallback(
    async (snapshot: CampaignSnapshot, computed: ComputedFields) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setRunId(null);
      setExperimentIds([]);
      setPendingSnapshot(snapshot);
      setPendingComputed(computed);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot, computed, simulationMode }),
        });

        const data: AnalyzeResponse & { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Server error: ${res.status}`);
        }

        setResult(data.result);
        setCurrentSnapshot(snapshot);
        setCurrentComputed(computed);
        setRunId(data.runId ?? null);
        setExperimentIds(data.experimentIds ?? []);

        // Only save real runs to localStorage history
        if (!simulationMode) {
          const historyItem: HistoryItem = {
            id: data.runId ?? generateId(),
            timestamp: new Date().toISOString(),
            snapshot,
            computed,
            result: data.result,
          };
          saveToHistory(historyItem);
          setHistory(loadHistory());
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [simulationMode]
  );

  function handleRetry() {
    if (pendingSnapshot && pendingComputed) {
      runAnalysis(pendingSnapshot, pendingComputed);
    }
  }

  function handleLoadHistory(item: HistoryItem) {
    setResult(item.result);
    setCurrentSnapshot(item.snapshot);
    setCurrentComputed(item.computed);
    setRunId(item.id);
    setExperimentIds([]);
    setError(null);
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <Header
        result={result}
        snapshot={currentSnapshot}
        computed={currentComputed}
        simulationMode={simulationMode}
        onToggleSimulation={handleToggleSimulation}
        history={history}
        onLoadHistory={handleLoadHistory}
      />

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "minmax(360px, 420px) 1fr", gap: "1.25rem", alignItems: "start" }}
          className="layout-grid"
        >
          {/* Left: Form */}
          <div
            className="glass-card-elevated"
            style={{
              position: "sticky",
              top: "72px",
              height: "calc(100vh - 90px)",
              display: "flex",
              flexDirection: "column",
              overflow: "clip",
              borderColor: simulationMode ? "rgba(245,158,11,0.15)" : undefined,
              transition: "border-color 0.3s",
            }}
          >
            <CampaignSnapshotForm
              onAnalyze={runAnalysis}
              isLoading={isLoading}
              simulationMode={simulationMode}
            />
          </div>

          {/* Right: Results */}
          <div
            className="glass-card-elevated"
            style={{ minHeight: "calc(100vh - 90px)", display: "flex", flexDirection: "column", overflow: "clip" }}
          >
            <ResultsPanel
              result={result}
              snapshot={currentSnapshot}
              computed={currentComputed}
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
              runId={runId}
              experimentIds={experimentIds}
            />
          </div>
        </div>
      </main>

      <SettingsButton />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <style>{`
        @media (max-width: 900px) {
          .layout-grid {
            grid-template-columns: 1fr !important;
          }
          .layout-grid > div:first-child {
            position: static !important;
            height: auto !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
