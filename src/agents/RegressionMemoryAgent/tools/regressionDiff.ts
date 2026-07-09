export const SIMILARITY_THRESHOLD = 0.85;

export type Classification = "NEW" | "PERSISTENT" | "REGRESSION" | "RESOLVED";

export function classifyFinding(
  score: number,
  priorStatus: string | undefined
): Classification {
  if (score < SIMILARITY_THRESHOLD || !priorStatus) {
    return "NEW";
  }

  if (priorStatus === "RESOLVED") {
    return "REGRESSION";
  }

  return "PERSISTENT";
}
