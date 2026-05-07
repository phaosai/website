import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, Trash2, Eye } from "lucide-react";
import type { PciResult } from "./PciBreakdownModal";
import type { AssetClass } from "@/data/simulationCandidates";

export interface SavedSearch {
  id: string;
  label: string;
  inputs: {
    asset_classes?: AssetClass[];
    platforms?: string[];
    pci_min?: number;
    pci_max?: number;
    quantum_enabled?: boolean;
  };
  results: PciResult[];
  source: string;
  created_at: string;
}

interface Props {
  refreshKey: number;
  onLoad?: (s: SavedSearch) => void;
}

export const SavedSearchesPanel = ({ refreshKey, onLoad }: Props) => {
  const [rows, setRows] = useState<SavedSearch[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("sunesis_saved_searches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    if (data) setRows(data as unknown as SavedSearch[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const remove = async (id: string) => {
    await supabase.from("sunesis_saved_searches").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-purple-deep" />
        <p className="text-sm font-semibold">Saved searches</p>
        <span className="text-xs text-muted-foreground">({rows.length})</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Every research run is saved here automatically so you can return to it later.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2.5">When</th>
                <th className="text-left p-2.5">Label</th>
                <th className="text-left p-2.5">Results</th>
                <th className="text-left p-2.5">Source</th>
                <th className="text-right p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-accent/30">
                  <td className="p-2.5 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-2.5">{r.label}</td>
                  <td className="p-2.5 tabular-nums">{r.results?.length ?? 0}</td>
                  <td className="p-2.5 text-xs uppercase tracking-wider text-muted-foreground">
                    {r.source}
                  </td>
                  <td className="p-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => onLoad?.(r)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        aria-label="Load saved search"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-pci-no-go hover:bg-pci-no-go/10"
                        aria-label="Delete saved search"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
