import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';

import { AiChatApiResponse, AiChatMessage, AiChatRequest } from '../ai-chat.model';
import { ChartsConfigService } from '../../proof-points/services/charts-config.service';
import { mapAiChatResponseToMessage } from '../utils/chat-response-mapper';

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly http = inject(HttpClient);
  private readonly chartsConfig = inject(ChartsConfigService);

  sendPrompt(request: AiChatRequest): Observable<AiChatMessage> {
    return this.chartsConfig.loadConfig().pipe(
      switchMap(config =>
        this.http.post<AiChatApiResponse>('secure-data/ai-chat', request).pipe(
          map(response => mapAiChatResponseToMessage(response, config)),
        ),
      ),
    );
  }
}
