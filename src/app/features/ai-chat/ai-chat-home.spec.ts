import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AiChatHome } from './ai-chat-home';

describe('AiChatHome', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AiChatHome],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  function flushAppConfig(aiChatEnabled: boolean, enableAiChat = true): void {
    httpMock.expectOne('app-config').flush({
      appName: 'SSA',
      version: '1.0.0',
      environment: 'local',
      features: { aiChat: aiChatEnabled },
      enableAiChat,
      bypassOktaAuth: true,
      clientId: '0oaDevClientId',
    });
  }

  it('enables send once prompt text is entered and ai chat is enabled', () => {
    const fixture = TestBed.createComponent(AiChatHome);
    fixture.detectChanges();
    flushAppConfig(true);

    const component = fixture.componentInstance;
    expect(component.canSend()).toBe(false);

    component.onPromptInput({
      target: { value: 'hello' },
    } as unknown as Event);
    fixture.detectChanges();

    expect(component.canSend()).toBe(true);
  });

  it('keeps send disabled when ai chat feature is off', () => {
    const fixture = TestBed.createComponent(AiChatHome);
    fixture.detectChanges();
    flushAppConfig(false);

    const component = fixture.componentInstance;
    component.onPromptInput({
      target: { value: 'hello' },
    } as unknown as Event);
    fixture.detectChanges();

    expect(component.canSend()).toBe(false);
    expect(component.featureError()).toContain('Admin page');
  });

  it('keeps send disabled when platform gate is off', () => {
    const fixture = TestBed.createComponent(AiChatHome);
    fixture.detectChanges();
    flushAppConfig(true, false);

    const component = fixture.componentInstance;
    component.onPromptInput({
      target: { value: 'hello' },
    } as unknown as Event);
    fixture.detectChanges();

    expect(component.canSend()).toBe(false);
    expect(component.featureError()).toContain('ENABLE_AI_CHAT');
  });
});
