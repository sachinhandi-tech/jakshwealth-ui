import { ProofPointChartConfig } from '../proof-points/proof-points-charts-api.model';

export type AiChatResponseType = 'text' | 'table' | 'chart';
export type AiChatChartType = 'bar' | 'doughnut' | 'pie';

export interface AiChatRequest {
  prompt: string;
  useLiveData?: boolean;
  llmService?: 'mock' | 'remote';
}

export interface AiChatMeta {
  llmProvider: string;
  llmModel: string;
  sql?: string;
  paramCount?: number;
  verificationWarnings?: string[];
}

export interface AiChatTableColumn {
  key: string;
  label: string;
}

export interface AiChatTextResponse {
  responseType: 'text';
  content: string;
  meta?: AiChatMeta;
}

export interface AiChatTableResponse {
  responseType: 'table';
  title?: string;
  columns: AiChatTableColumn[];
  rows: Record<string, unknown>[];
  meta?: AiChatMeta;
}

export interface AiChatChartApiResponse {
  responseType: 'chart';
  chartType: AiChatChartType;
  chartId: string;
  title: string;
  explanation?: string;
  labels: string[];
  data: number[] | number[][];
  centerLines?: string[];
  hoverMessages?: string[];
  meta?: AiChatMeta;
}

export type AiChatApiResponse = AiChatTextResponse | AiChatTableResponse | AiChatChartApiResponse;

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  prompt?: string;
  responseType?: AiChatResponseType;
  content?: string;
  table?: {
    title?: string;
    columns: AiChatTableColumn[];
    rows: Record<string, unknown>[];
  };
  chart?: ProofPointChartConfig;
  meta?: AiChatMeta;
  error?: string;
}
