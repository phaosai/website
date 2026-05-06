## What happened

The current Sunesis screen can show “no instruments matched” even for Stock + Robinhood because the live research function is using a separate hardcoded universe and strict platform intersection, while the UI platform list comes from the database. Some asset-class/platform pairs exist in the UI but have no matching instrument rows in the edge function universe. The screenshot section is `SunesisMoatStrip`, which is purely explanatory and should be removed for the productized flow.

## Implementation plan

1. **Make Sunesis return results for every valid selection**
   - Replace the small edge-function-only `LIVE_UNIVERSE` with the fuller canonical Sunesis candidate universe.
   - Ensure every visible asset class has at least one valid, real instrument/proxy for every compatible brokerage/platform shown in the UI.
   - Normalize platform slugs and asset class values so database values, UI values, and edge function values cannot drift.
   - For unsupported combinations, remove or disable the impossible path rather than showing a selectable option that fails later.

2. **Guarantee all brokerages and combinations behave predictably**
   - Filter brokerages by selected asset classes so users only see platforms that can actually return results.
   - When multiple asset classes and platforms are selected, return the ranked union of all valid intersections instead of failing the whole request because one pair has no coverage.
   - Add a coverage summary in the response so the UI can distinguish “not available on that brokerage” from a backend failure.

3. **Wire the promoted Foundry brain cleanly into live Sunesis**
   - Keep live ranking tied to the active `promoted_brains` row.
   - Include promoted-brain metadata in the response for auditability.
   - Avoid any “simulated” messaging in live mode unless the account is explicitly sandbox/demo.

4. **Add the Quantum toggle and auto-engage rules**
   - Add a manual Quantum toggle to the Sunesis research controls.
   - Auto-enable Quantum when the user selects:
     - more than 3 asset classes, or
     - more than 3 brokerages, or
     - more than 6 total selections across asset classes + brokerages.
   - Send `quantum_enabled` to the research function so the backend can apply the advanced validation branch.
   - Respect existing membership limits for PCI range access and Quantum availability.

5. **Simplify the going-live Sunesis UI**
   - Remove the entire section shown in the screenshot: `Truth Machine`, `Quantum Audit`, `QRR`, `Truth Ledger`, `Scenario Sandbox`, `Workflow Ready`.
   - Keep the screen focused on:
     - asset class selection,
     - brokerage/platform selection,
     - PCI range where membership allows it,
     - Quantum toggle,
     - Generate results,
     - ranked PCI table.

6. **Remove or hide non-working product paths**
   - Remove/disable asset class/platform options that cannot produce at least one valid research result.
   - Replace vague “no instruments matched” with a clear, product-safe message only when the user’s membership/filters intentionally exclude all results.

7. **Validate before finishing**
   - Test the deployed `sunesis-live-research` function for Stock + Robinhood.
   - Test representative combinations across stocks, ETFs, options, forex, crypto, bonds, commodities, and DEX assets.
   - Confirm the removed screenshot section no longer appears on Sunesis.
   - Confirm the UI shows results rather than an empty state for valid combinations.