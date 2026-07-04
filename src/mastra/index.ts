import { Mastra } from "@mastra/core/mastra";
import { repoScannerAgent } from "../agents/RepoScannerAgent";

export const mastra = new Mastra({
  agents: {
    repoScannerAgent,
  },
});
