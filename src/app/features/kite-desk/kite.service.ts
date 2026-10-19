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
}
