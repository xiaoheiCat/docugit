import type { DocumentType } from "../../shared/types.ts";

type Translate = (key: string) => string;

export function formatDocumentTypeLabel(type: DocumentType, t: Translate): string {
  return t(`documentType.${type}`);
}
