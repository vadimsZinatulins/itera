import 'server-only';
import type { DocumentSaveFailureKind, DocumentSaveFailureStage } from '../types/submission';

export function reportDocumentSaveFailure(stage: DocumentSaveFailureStage, kind: DocumentSaveFailureKind) {
  console.error('Learning Document save failed.', { stage, kind });
}
