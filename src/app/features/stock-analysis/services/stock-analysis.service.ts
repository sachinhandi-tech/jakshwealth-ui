import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap, takeWhile, timer } from 'rxjs';

import {
  StockScanJobResponse,
  StockScanRequest,
  StockUniverseResponse,
  UniverseSegment,
} from '../stock-analysis.model';

@Injectable({ providedIn: 'root' })
export class StockAnalysisService {
  private readonly http = inject(HttpClient);

  private static readonly POLL_MS = 2000;

  getUniverse(segment: UniverseSegment): Observable<StockUniverseResponse> {
    return this.http.get<StockUniverseResponse>(`secure-data/stock-universe`, {
      params: { segment },
    });
  }

  /** Start async scan and poll until complete, emitting each job status update. */
  runScanAsync(request: StockScanRequest): Observable<StockScanJobResponse> {
    return this.http
      .post<StockScanJobResponse>('secure-data/stock-scan/async', request)
      .pipe(switchMap(started => this.pollScanJob(started.jobId)));
  }

  getScanJob(jobId: string): Observable<StockScanJobResponse> {
    return this.http.get<StockScanJobResponse>(`secure-data/stock-scan/jobs/${jobId}`);
  }

  private pollScanJob(jobId: string): Observable<StockScanJobResponse> {
    return timer(0, StockAnalysisService.POLL_MS).pipe(
      switchMap(() => this.getScanJob(jobId)),
      takeWhile(
        job => job.status === 'pending' || job.status === 'running',
        true,
      ),
    );
  }
}
