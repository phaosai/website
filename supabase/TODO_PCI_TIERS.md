# TODO — Internal PCI tier designations

The user-facing PCI display uses 5 tiers (Strong / Constructive / Watch / Caution / Stand Aside)
mapped to the 1–100 score. These are the ONLY tier labels permitted in the UI.

INTERNAL tier designations (engineering / research) are still TBD and are intentionally
not exposed in any UI surface. They will eventually live alongside the score on:

- `public.research_items` (column TBD, e.g. `pci_internal_tier`)
- `public.simulation_runs` (column TBD, e.g. `pci_internal_tier`)
- The Phaos Sunesis product page (`/one/sunesis`) — internal-tier badge mock-up section (commented out)

DO NOT add a second user-facing 1–100 score. PCI is the only one.
