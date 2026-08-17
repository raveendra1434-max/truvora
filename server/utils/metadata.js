import { BRAND } from "./branding.js";

function createMetadata(reportId, documentType) {
  return {
    reportId,
    company: BRAND.company.fullName,
    website: BRAND.company.website,
    aiEngine: BRAND.document.aiEngine,
    version: BRAND.document.version,
    generatedAt: new Date().toLocaleString(),
    classification: "Enterprise",
    status: "Completed",
    documentType,
  };
}

export { createMetadata };