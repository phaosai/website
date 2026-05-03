import { createLovableConfig } from "lovable-agent-playwright-config/config";

export default createLovableConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
});
