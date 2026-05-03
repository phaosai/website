// Compliance disclaimers — exact text mandated by financial services review.
// Use these components everywhere the related output is displayed.

import { ReactNode } from "react";

const Block = ({ children }: { children: ReactNode }) => (
  <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-border pl-3">
    {children}
  </p>
);

export const FooterDisclaimer = () => (
  <p className="text-xs text-muted-foreground leading-relaxed">
    Phaos AI is a financial research and workflow intelligence platform. It is not a registered
    investment advisor. All research outputs are for informational purposes only and do not
    constitute personalized financial advice.
  </p>
);

export const PCIDisclaimer = () => (
  <Block>
    PCI is a research confidence score based on publicly available signals. It does not predict
    or guarantee investment returns.
  </Block>
);

export const SimulationDisclaimer = () => (
  <Block>
    <span className="font-semibold not-italic">SIMULATED</span> — This is a scenario analysis
    tool, not a financial forecast.
  </Block>
);

export const TruthMemoDisclaimer = () => (
  <Block>
    This memo is research intelligence based on publicly available information. It is not
    personalized financial advice.
  </Block>
);

export const ThemeDisclaimer = () => (
  <Block>
    Investment themes are research frameworks, not buy recommendations. Historical examples do
    not predict future performance.
  </Block>
);

export const HistoricalExampleDisclaimer = () => (
  <Block>
    <span className="font-semibold not-italic">HISTORICAL EXAMPLE</span> — This illustrates
    historical signal patterns. Not a prediction of future returns.
  </Block>
);

export const PricingDisclaimer = () => (
  <Block>
    All plans provide access to research and workflow intelligence tools. Phaos AI does not
    provide investment advice.
  </Block>
);

export const ROIDisclaimer = () => (
  <Block>
    These estimates illustrate potential efficiency gains only. Phaos AI does not predict
    investment returns.
  </Block>
);

export const PlatformPreferenceNote = () => (
  <Block>
    Platform preference is for context only. Phaos AI does not execute trades.
  </Block>
);
