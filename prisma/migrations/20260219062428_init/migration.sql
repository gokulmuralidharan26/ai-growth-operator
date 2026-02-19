-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brand" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "window" TEXT NOT NULL,
    "channelMix" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "trends" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "aiOutput" TEXT NOT NULL,
    "primaryBottleneck" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "brand" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "bottleneckType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "setup" TEXT NOT NULL,
    "successMetrics" TEXT NOT NULL DEFAULT '[]',
    "guardrails" TEXT NOT NULL DEFAULT '[]',
    "linkedRunId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Proposed',
    CONSTRAINT "Experiment_linkedRunId_fkey" FOREIGN KEY ("linkedRunId") REFERENCES "AnalysisRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExperimentOutcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experimentId" TEXT NOT NULL,
    "outcomeStatus" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "metricsDelta" TEXT NOT NULL DEFAULT '{}',
    "learnings" TEXT NOT NULL DEFAULT '[]',
    "recommendedNext" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "ExperimentOutcome_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
