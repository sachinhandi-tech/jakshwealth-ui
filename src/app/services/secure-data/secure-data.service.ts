import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SecureDataService {
  private readonly http = inject(HttpClient);

  /**
   * Calls the protected `GET /jw-api/secure-data` endpoint. The url + auth
   * interceptors prefix the base API URL and attach the bearer token; the API's
   * authorizer rejects callers without USER_GG or ADMIN_GG membership.
   */
  getSecureData(): Observable<SecureData> {
    return this.http.get<SecureData>('secure-data');
  }
}

export interface SecureData {
  message: string;
  lanId?: string;
  roles?: string[];
  principalId: string;
  servedAt: string;
}
