// Quantum Audit — UI-first mocked service.
// Backend-ready abstractions for a future IBM Quantum integration.
// IMPORTANT: do not call IBM here. Secrets live in Lovable/Supabase only.

export type QuantumPlan = "core" | "pro" | "elite";

export interface QuantumEntitlement {
  plan: QuantumPlan;
  monthlyAllowance: number;
  used: number;
  remaining: number;
  eligible: boolean;
}

export interface QuantumAuditPayload {
  ticker: string;
  investmentType: string;
  platforms: string[];
  simulationMode: string;
}

export interface QuantumAuditReceipt {
  auditId: string;
  timestamp: string;
  ticker: string;
  investmentType: string;
  platforms: string[];
  simulationMode: string;
  validationLayer: string;
  basketScope: string;
  status: "Completed";
  summary: string;
  compliance: string;
}

export const QUANTUM_PLAN_ALLOWANCE: Record<QuantumPlan, number> = {
  core: 1,
  pro: 4,
  elite: 8,
};

export function getQuantumAuditEntitlement(plan: QuantumPlan | null, used = 0): QuantumEntitlement {
  if (!plan) {
    return { plan: "core", monthlyAllowance: 0, used: 0, remaining: 0, eligible: false };
  }
  const allowance = QUANTUM_PLAN_ALLOWANCE[plan];
  return {
    plan,
    monthlyAllowance: allowance,
    used,
    remaining: Math.max(0, allowance - used),
    eligible: true,
  };
}

// Placeholder — wire to Supabase once table exists.
export async function getQuantumAuditUsage(_userId: string): Promise<number> {
  return 0;
}

// Placeholder — future edge function will create a real job server-side.
export async function createQuantumAuditJob(payload: QuantumAuditPayload): Promise<{ jobId: string }> {
  return { jobId: `qa_${Date.now().toString(36)}` };
}

export const QUANTUM_AUDIT_STEPS: string[] = [
  "Preparing basket for advanced validation…",
  "Building constrained optimization set…",
  "Verifying premium compute availability…",
  "Simulating hybrid validation workflow…",
  "Generating audit-ready research receipt…",
  "Completed",
];

export async function simulateQuantumAuditRun(
  onStep: (stepIndex: number, label: string) => void,
): Promise<void> {
  for (let i = 0; i < QUANTUM_AUDIT_STEPS.length; i++) {
    await new Promise((r) => setTimeout(r, 650 + Math.random() * 400));
    onStep(i, QUANTUM_AUDIT_STEPS[i]);
  }
}

export function generateQuantumAuditReceipt(payload: QuantumAuditPayload): QuantumAuditReceipt {
  const id = `QA-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    auditId: id,
    timestamp: new Date().toISOString(),
    ticker: payload.ticker,
    investmentType: payload.investmentType,
    platforms: payload.platforms,
    simulationMode: payload.simulationMode,
    validationLayer: "Advanced Compute Audit",
    basketScope: "Top filtered candidates only",
    status: "Completed",
    summary: "Supplemental hybrid validation pass complete. Audit-ready research receipt generated.",
    compliance:
      "This output is for research workflow support only. It is not a prediction of returns or investment advice.",
  };
}
