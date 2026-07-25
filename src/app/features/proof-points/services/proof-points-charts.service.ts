import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';

import {
  ProofPointsChartsApiResponse,
  ProofPointsChartsRequest,
  ProofPointsChartsResponse,
} from '../proof-points-charts-api.model';
import { buildProofPointCharts } from '../utils/chart-builder';
import { ChartsConfigService } from './charts-config.service';

@Injectable({ providedIn: 'root' })
export class ProofPointsChartsService {
  private readonly http = inject(HttpClient);
  private readonly chartsConfig = inject(ChartsConfigService);

  /** Load chart cards for the current designation, view, timeline, and filters. */
  getCharts(request: ProofPointsChartsRequest): Observable<ProofPointsChartsResponse> {
    return this.chartsConfig.loadConfig().pipe(
      switchMap(config =>
        this.http
          .post<ProofPointsChartsApiResponse>('secure-data/fetch-charts', request)
          .pipe(
            map(response => ({
              charts: buildProofPointCharts(response.charts, config, request),
            })),
          ),
      ),
    );
  }
}
