import {
  ChartsConfigFile,
  ProofPointChartApiPayload,
} from '../../proof-points/proof-points-charts-api.model';
import { buildChartFromApiPayload } from '../../proof-points/utils/chart-builder';
import {
  AiChatApiResponse,
  AiChatChartApiResponse,
  AiChatMessage,
} from '../ai-chat.model';

const DEFAULT_CHART_CONTEXT = {
  designationLabel: 'AI',
  viewLabel: 'Chat',
  timelineLabel: 'Current',
  metric: 'Value',
  comparison: 'Comparison',
};

export function mapAiChatResponseToMessage(
  response: AiChatApiResponse,
  chartsConfig: ChartsConfigFile,
): AiChatMessage {
  const id = crypto.randomUUID();

  if (response.responseType === 'text') {
    return {
      id,
      role: 'assistant',
      responseType: 'text',
      content: response.content,
      meta: response.meta,
    };
  }

  if (response.responseType === 'table') {
    return {
      id,
      role: 'assistant',
      responseType: 'table',
      table: {
        title: response.title,
        columns: response.columns,
        rows: response.rows,
      },
      meta: response.meta,
    };
  }

  const chartPayload = toProofPointChartPayload(response);
  return {
    id,
    role: 'assistant',
    responseType: 'chart',
    chart: buildChartFromApiPayload(chartPayload, chartsConfig, DEFAULT_CHART_CONTEXT),
    meta: response.meta,
  };
}

function toProofPointChartPayload(response: AiChatChartApiResponse): ProofPointChartApiPayload {
  return {
    chartId: response.chartId,
    chartType: response.chartType === 'pie' ? 'doughnut' : response.chartType,
    title: response.title,
    explanation: response.explanation,
    labels: response.labels,
    data: response.data,
    centerLines: response.centerLines,
    hoverMessages: response.hoverMessages,
  };
}

export function createUserMessage(prompt: string): AiChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    prompt,
    content: prompt,
  };
}

export function createErrorMessage(message: string): AiChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    responseType: 'text',
    content: message,
    error: message,
  };
}
