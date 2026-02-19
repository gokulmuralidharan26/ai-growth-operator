import type { CampaignSnapshot } from "./schema";

export interface Scenario {
  label: string;
  description: string;
  snapshot: CampaignSnapshot;
}

export const SCENARIOS: Record<string, Scenario> = {
  creativeFatigue: {
    label: "Creative Fatigue",
    description: "High spend, declining CTR and CVR — creative performance burning out",
    snapshot: {
      brandName: "Lumière Beauty",
      industry: "Beauty",
      timeWindow: "14 days",
      channelMix: { meta: 70, google: 20, tiktok: 10 },
      metrics: {
        spend: 28000,
        revenue: 58800,
        ctr: 0.9,
        cpm: 22.5,
        conversionRate: 1.4,
        aov: 68,
        ltv: 195,
      },
      trends: {
        roasDelta: -18,
        ctrDelta: -24,
        cvrDelta: -15,
      },
      notes:
        "Same 3 ad creatives running since week 1. Frequency is now 4.2. No new UGC or creative variations introduced. Brand awareness campaign ended 3 weeks ago.",
    },
  },

  scalingTooFast: {
    label: "Scaling Too Fast",
    description: "Rapid budget increase causing CPM spike and efficiency drop",
    snapshot: {
      brandName: "Vitality Wellness",
      industry: "Wellness",
      timeWindow: "7 days",
      channelMix: { meta: 55, google: 30, tiktok: 15 },
      metrics: {
        spend: 42000,
        revenue: 63000,
        ctr: 1.8,
        cpm: 38.4,
        conversionRate: 1.1,
        aov: 95,
        ltv: 280,
      },
      trends: {
        roasDelta: -32,
        ctrDelta: -8,
        cvrDelta: -12,
      },
      notes:
        "Budget increased 3x in 5 days following board approval. Expanded from 3 to 12 ad sets. Audience overlap warnings appearing in Ads Manager. No creative refresh done prior to scale.",
    },
  },

  landingPageDrop: {
    label: "Landing Page Drop",
    description: "Good CTR but severe conversion rate collapse post-click",
    snapshot: {
      brandName: "Atelier Mode",
      industry: "Fashion",
      timeWindow: "7 days",
      channelMix: { meta: 45, google: 35, tiktok: 20 },
      metrics: {
        spend: 18500,
        revenue: 27750,
        ctr: 2.6,
        cpm: 18.2,
        conversionRate: 0.7,
        aov: 145,
        ltv: 320,
      },
      trends: {
        roasDelta: -28,
        ctrDelta: 5,
        cvrDelta: -45,
      },
      notes:
        "Deployed new landing page redesign 8 days ago. Mobile checkout flow changed. A/B test running on product page but may have broken tracking. Shopify theme update deployed same day.",
    },
  },
};
