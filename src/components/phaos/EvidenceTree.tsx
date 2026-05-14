import { ExternalLink, FolderTree } from "lucide-react";

export interface EvidenceNode {
  category: string;          // e.g., "Insider Activity"
  count: number;
  freshness?: string;        // ISO timestamp of newest evidence
  items?: { label: string; url?: string; ts?: string }[];
}

interface Props {
  nodes: EvidenceNode[];
}

/**
 * Evidence Tree — collapsible category → source breakdown. Makes provenance
 * skimmable in a single panel.
 */
export function EvidenceTree({ nodes }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card/50 p-5">
      <header className="flex items-center gap-2 mb-3">
        <FolderTree className="w-4 h-4 text-purple-deep" />
        <h3 className="text-sm font-semibold">Evidence Tree</h3>
      </header>
      {nodes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No evidence compiled yet.</p>
      ) : (
        <ul className="space-y-3">
          {nodes.map((n) => (
            <li key={n.category} className="border border-border rounded-md p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-medium">{n.category}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span className="px-1.5 py-0.5 rounded border border-border">{n.count} sources</span>
                  {n.freshness && <span>· updated {new Date(n.freshness).toLocaleDateString()}</span>}
                </div>
              </div>
              {n.items && n.items.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {n.items.slice(0, 4).map((it, i) => (
                    <li key={i} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {it.url ? (
                        <a href={it.url} target="_blank" rel="noreferrer" className="text-purple-deep hover:underline truncate">
                          {it.label}
                        </a>
                      ) : (
                        <span className="truncate">{it.label}</span>
                      )}
                      {it.ts && <span className="ml-auto text-[10px] opacity-70">{new Date(it.ts).toLocaleDateString()}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
