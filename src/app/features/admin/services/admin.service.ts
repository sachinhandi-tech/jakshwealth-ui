import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AdminFeatures {
  aiChat: boolean;
  utilization?: boolean;
  proofPoints?: boolean;
  systemAdmin?: boolean;
  [key: string]: boolean | undefined;
}

export interface AdminResponse {
  message: string;
  enableAiChat: boolean;
  features: AdminFeatures;
  servedAt: string;
  lanId?: string;
  roles?: string[];
}

export interface UpdateAdminFeaturesRequest {
  features: Partial<AdminFeatures>;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getAdminArea(): Observable<AdminResponse> {
    return this.http.get<AdminResponse>('secure-data/admin');
  }

  updateFeatures(request: UpdateAdminFeaturesRequest): Observable<AdminResponse> {
    return this.http.post<AdminResponse>('secure-data/admin/features', request);
  }
}
