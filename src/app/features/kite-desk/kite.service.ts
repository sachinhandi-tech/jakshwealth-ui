import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { currentKiteApiBase, currentPlatformUserId } from './kite.api';
import {
  KiteLoginRequest,
  KiteProfile,
  KiteQuote,
  KiteSessionStatus,
  KiteSignalJob,
  KiteSignalRequest,
  KiteSubscriber,
  GttOrderRequest,
  GttOrderResponse,
  OhlcSnapshot,
} from './kite.model';

@Injectable({ providedIn: 'root' })
export class KiteService {
  private readonly http = inject(HttpClient);
  private readonly headers = new HttpHeaders({ 'no-retry': '1' });

  private deskHeaders(): HttpHeaders {
    const userId = currentPlatformUserId();
    return userId ? this.headers.set('X-Platform-User-Id', userId) : this.headers;
  }

  session(): Observable<KiteSessionStatus> {
    return this.http.get<KiteSessionStatus>(`${currentKiteApiBase()}/api/kite/session`, {
      headers: this.deskHeaders(),
    });
  }

  subscribers(): Observable<{ subscribers: KiteSubscriber[] }> {
    return this.http.get<{ subscribers: KiteSubscriber[] }>(`${currentKiteApiBase()}/api/kite/subscribers`, {
      headers: this.deskHeaders(),
    });
  }

  login(body: KiteLoginRequest): Observable<KiteSessionStatus> {
    return this.http.post<KiteSessionStatus>(`${currentKiteApiBase()}/api/kite/login`, body, {
      headers: this.deskHeaders(),
    });
  }

  logout(): Observable<KiteSessionStatus> {
    return this.http.post<KiteSessionStatus>(
      `${currentKiteApiBase()}/api/kite/logout`,
      {},
      { headers: this.deskHeaders() },
    );
  }

  profile(): Observable<KiteProfile> {
    return this.http.get<KiteProfile>(`${currentKiteApiBase()}/api/kite/profile`, {
      headers: this.deskHeaders(),
    });
  }

  quotes(): Observable<KiteQuote[]> {
    return this.http.get<KiteQuote[]>(`${currentKiteApiBase()}/api/kite/quotes`, {
      headers: this.deskHeaders(),
    });
  }

  startScan(body: KiteSignalRequest): Observable<{ job_id: string; status: string }> {
    return this.http.post<{ job_id: string; status: string }>(`${currentKiteApiBase()}/api/kite/signals`, body, {
      headers: this.deskHeaders(),
    });
  }

  signalJob(jobId: string): Observable<KiteSignalJob> {
    return this.http.get<KiteSignalJob>(`${currentKiteApiBase()}/api/kite/signals/${jobId}`, {
      headers: this.deskHeaders(),
    });
  }

  scannerData(): Observable<unknown> {
    return this.http.get<unknown>(`${currentKiteApiBase()}/api/scanner-data`, {
      headers: this.deskHeaders(),
    });
  }

  ohlcSnapshot(symbols: string[]): Observable<OhlcSnapshot> {
    const query = encodeURIComponent(symbols.join(','));
    return this.http.get<OhlcSnapshot>(`${currentKiteApiBase()}/api/ohlc?symbols=${query}`, {
      headers: this.deskHeaders(),
    });
  }

  openTicks(tokens: number[]): WebSocket {
    const base = currentKiteApiBase().replace(/^http/i, 'ws');
    const query = tokens.join(',');
    const user = currentPlatformUserId();
    const userQuery = user ? `&platform_user_id=${encodeURIComponent(user)}` : '';
    return new WebSocket(`${base}/ws/ticks?tokens=${query}&mode=full${userQuery}`);
  }

  gttState(orders: GttOrderRequest[]): Observable<GttOrderResponse> {
    return this.http.post<GttOrderResponse>(`${currentKiteApiBase()}/api/algo-orders/gtt-state`, { orders }, {
      headers: this.deskHeaders(),
    });
  }

  liveGtt(orders: GttOrderRequest[]): Observable<GttOrderResponse> {
    return this.http.post<GttOrderResponse>(`${currentKiteApiBase()}/api/algo-orders/live-gtt`, {
      confirm_live: true,
      orders,
    }, {
      headers: this.deskHeaders(),
    });
  }
}
