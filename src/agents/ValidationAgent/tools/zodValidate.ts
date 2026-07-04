import { SecretFindingSchema, VulnFindingSchema, RegressionResultSchema, ValidationResultSchema } from "../../../schema/events";
import { z } from "zod";

export function runZodValidation(finding: any): z.infer<typeof ValidationResultSchema> {
  // If it has classification, it's a regression finding
  // If it has findingType, it's a vuln
  // If it has patternType, it's a secret
  
  try {
    if (finding.classification) {
      RegressionResultSchema.parse(finding);
    } else if (finding.findingType) {
      VulnFindingSchema.parse(finding);
    } else if (finding.patternType) {
      SecretFindingSchema.parse(finding);
    } else {
      throw new Error("Unknown finding structure, unable to match to a schema.");
    }

    return {
      checkType: "ZOD_STRUCTURAL",
      verdict: "PASS",
      confidence: 1.0,
      finding
    };
  } catch (err: any) {
    return {
      checkType: "ZOD_STRUCTURAL",
      verdict: "FAIL",
      confidence: 1.0,
      message: err.message || "Schema validation failed",
      finding
    };
  }
}
