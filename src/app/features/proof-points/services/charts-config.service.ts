import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { ChartsConfigFile } from '../proof-points-charts-api.model';

@Injectable({ providedIn: 'root' })
export class ChartsConfigService {
  private readonly http = inject(HttpClient);
  private config$?: Observable<ChartsConfigFile>;

  /** Load shared chart styling config from assets. */
  loadConfig(): Observable<ChartsConfigFile> {
    if (!this.config$) {
      this.config$ = this.http
        .get<ChartsConfigFile>('/assets/config/charts.config.json')
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.config$;
  }
}
