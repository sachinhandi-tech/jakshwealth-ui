import { Routes } from '@angular/router';

export const AI_CHAT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./ai-chat-home').then(m => m.AiChatHome),
  },
];
