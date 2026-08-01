import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  StockScanRequest,
  StockScanResponse,
  StockUniverseResponse,
  UniverseSegment,
} from '../stock-analysis.model';

@Injectable({ providedIn: 'root' })
export class StockAnalysisService {
  private readonly http = inject(HttpClient);

  getUniverse(segment: UniverseSegment): Observable<StockUniverseResponse> {
    const params = new HttpParams().set('segment', segment);
    return this.http.get<StockUniverseResponse>('secure-data/stock-universe', { params });
  }

  runScan(request: StockScanRequest): Observable<StockScanResponse> {
    return this.http.post<StockScanResponse>('secure-data/stock-scan', request);
  }
}
