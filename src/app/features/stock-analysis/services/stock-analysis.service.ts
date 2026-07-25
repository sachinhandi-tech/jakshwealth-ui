import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  StockScanRequest,
  StockScanResponse,
  StockUniverseResponse,
} from '../stock-analysis.model';

@Injectable({ providedIn: 'root' })
export class StockAnalysisService {
  private readonly http = inject(HttpClient);

  getUniverse(): Observable<StockUniverseResponse> {
    return this.http.get<StockUniverseResponse>('secure-data/stock-universe');
  }

  runScan(request: StockScanRequest): Observable<StockScanResponse> {
    return this.http.post<StockScanResponse>('secure-data/stock-scan', request);
  }
}
