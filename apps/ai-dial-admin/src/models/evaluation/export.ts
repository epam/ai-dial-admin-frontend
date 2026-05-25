export interface EvalSummaryExportRequestDto {
  runId: string;
  computation: string;
  columns: string[];
  delimiter: string;
}

export type EvalSummaryPreviewResponse = unknown[][];
