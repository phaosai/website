import { useState } from "react";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import { WatchlistPanel } from "@/components/sunesis/WatchlistPanel";

export default function SunesisWatchlists() {
  const [refreshKey] = useState(0);
  return (
    <PageShell
      title="Watchlists"
      description="Organize tracked instruments into named groups. Each group shows its own combined WLH-ROI and every item shows its individual percentage."
      minTier="free"
    >
      <WatchlistPanel refreshKey={refreshKey} fullPage />
      <Disclaimer>WLH-ROI is a hypothetical, equal-weighted return-since-add. Not a prediction of returns.</Disclaimer>
    </PageShell>
  );
}
