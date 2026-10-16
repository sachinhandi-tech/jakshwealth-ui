import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { KITE_API_BASE } from './kite.api';
import {
  KiteLoginRequest,
  KiteProfile,
  KiteQuote,
  KiteSessionStatus,
  KiteSignalRequest,
  KiteSignalResult,
  UnivestAttempt,
  UnivestParseResponse,
} from './kite.model';

@Injectable({ providedIn: 'root' })
export class KiteService {
  private readonly http = inject(HttpClient);
  private readonly headers = new HttpHeaders({ 'no-retry': '1' });

  session(): Observable<KiteSessionStatus> {
    return this.http.get<KiteSessionStatus>(`${KITE_API_BASE}/api/kite/session`, {
      headers: this.headers,
    });
  }

  login(body: KiteLoginRequest): Observable<KiteSessionStatus> {
    return this.http.post<KiteSessionStatus>(`${KITE_API_BASE}/api/kite/login`, body, {
      headers: this.headers,
    });
  }

  logout(): Observable<KiteSessionStatus> {
    return this.http.post<KiteSessionStatus>(
      `${KITE_API_BASE}/api/kite/logout`,
      {},
      { headers: this.headers },
    );
  }

  profile(): Observable<KiteProfile> {
    return this.http.get<KiteProfile>(`${KITE_API_BASE}/api/kite/profile`, {
      headers: this.headers,
    });
  }

  quotes(): Observable<KiteQuote[]> {
    return this.http.get<KiteQuote[]>(`${KITE_API_BASE}/api/kite/quotes`, {
      headers: this.headers,
    });
  }

  univestAttempts(): Observable<UnivestAttempt[]> {
    return this.http.get<{ attempts: UnivestAttempt[] }>(`${KITE_API_BASE}/api/kite/algo/signals`, {
      headers: this.headers,
    }).pipe(map(body => body.attempts ?? []));
  }

  parseUnivest(text: string): Observable<UnivestParseResponse> {
    return this.http.post<UnivestParseResponse>(
      `${KITE_API_BASE}/api/univest/notification`,
      { text },
      { headers: this.headers },
    );
  }

  signals(body: KiteSignalRequest): Observable<KiteSignalResult> {
    return this.http.post<KiteSignalResult>(`${KITE_API_BASE}/api/kite/signals`, body, {
      headers: this.headers,
    });
  }
}
