import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { KITE_API_BASE } from './kite.api';
import {
  KiteLoginRequest,
  KiteProfile,
  KiteQuote,
  KiteSessionStatus,
  KiteSignalJob,
  KiteSignalRequest,
  GttOrderRequest,
  GttOrderResponse,
  OhlcSnapshot,
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

  startScan(body: KiteSignalRequest): Observable<{ job_id: string; status: string }> {
    return this.http.post<{ job_id: string; status: string }>(`${KITE_API_BASE}/api/kite/signals`, body, {
      headers: this.headers,
    });
  }

  signalJob(jobId: string): Observable<KiteSignalJob> {
    return this.http.get<KiteSignalJob>(`${KITE_API_BASE}/api/kite/signals/${jobId}`, {
      headers: this.headers,
    });
  }

  scannerData(): Observable<unknown> {
    return this.http.get<unknown>(`${KITE_API_BASE}/api/scanner-data`, {
      headers: this.headers,
    });
  }

  ohlcSnapshot(symbols: string[]): Observable<OhlcSnapshot> {
    const query = encodeURIComponent(symbols.join(','));
    return this.http.get<OhlcSnapshot>(`${KITE_API_BASE}/api/ohlc?symbols=${query}`, {
      headers: this.headers,
    });
  }

  openTicks(tokens: number[]): WebSocket {
    const base = KITE_API_BASE.replace(/^http/i, 'ws');
    const query = tokens.join(',');
    return new WebSocket(`${base}/ws/ticks?tokens=${query}&mode=full`);
  }

  gttState(orders: GttOrderRequest[]): Observable<GttOrderResponse> {
    return this.http.post<GttOrderResponse>(`${KITE_API_BASE}/api/algo-orders/gtt-state`, { orders }, {
      headers: this.headers,
    });
  }

  liveGtt(orders: GttOrderRequest[]): Observable<GttOrderResponse> {
    return this.http.post<GttOrderResponse>(`${KITE_API_BASE}/api/algo-orders/live-gtt`, {
      confirm_live: true,
      orders,
    }, {
      headers: this.headers,
    });
  }
}
