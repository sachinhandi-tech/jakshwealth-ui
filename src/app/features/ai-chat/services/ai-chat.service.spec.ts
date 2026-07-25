import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { AiChatService } from './ai-chat.service';

describe('AiChatService', () => {
  let service: AiChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AiChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('posts prompts to secure-data/ai-chat and maps text responses', async () => {
    const responsePromise = firstValueFrom(
      service.sendPrompt({ prompt: 'hello' }),
    );

    httpMock.expectOne('/assets/config/charts.config.json').flush({
      defaults: { bar: 'bar_default', doughnut: 'doughnut_default' },
      schemes: { bar: [], doughnut: [] },
      chartBindings: [],
    });

    const req = httpMock.expectOne('secure-data/ai-chat');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ prompt: 'hello' });
    req.flush({
      responseType: 'text',
      content: 'Hello from SSA',
      meta: { llmProvider: 'mock', llmModel: 'mock-ssa-planner-v1' },
    });

    const message = await responsePromise;
    expect(message.role).toBe('assistant');
    expect(message.responseType).toBe('text');
    expect(message.content).toBe('Hello from SSA');
  });
});
