import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { currentKiteApiBase, currentPlatformUserId } from './kite.api';
import {
  Organization,
  OrganizationUser,
  Subscription,
} from './saas.model';

@Injectable({ providedIn: 'root' })
export class SaasService {
  private readonly http = inject(HttpClient);
  private readonly headers = new HttpHeaders({ 'no-retry': '1' });

  private deskHeaders(): HttpHeaders {
    const userId = currentPlatformUserId();
    return userId ? this.headers.set('X-Platform-User-Id', userId) : this.headers;
  }

  private apiRoot(): string {
    return currentKiteApiBase().replace(/\/kite$/, '');
  }

  getCurrentUser(): Observable<{ org_id: string; user_id: string; name: string; email: string; subscription_tier: string; user_role: string }> {
    return this.http.get<{ org_id: string; user_id: string; name: string; email: string; subscription_tier: string; user_role: string }>(
      `${this.apiRoot()}/admin/me`,
      { headers: this.deskHeaders() },
    );
  }

  getOrganization(org_id: string): Observable<Organization> {
    return this.http.get<Organization>(
      `${this.apiRoot()}/admin/organizations/${org_id}`,
      { headers: this.deskHeaders() },
    );
  }

  getOrganizationUsers(org_id: string): Observable<{ users: OrganizationUser[] }> {
    return this.http.get<{ users: OrganizationUser[] }>(
      `${this.apiRoot()}/admin/organizations/${org_id}/users`,
      { headers: this.deskHeaders() },
    );
  }

  addUser(org_id: string, body: { email: string; name: string; role: string }): Observable<OrganizationUser> {
    return this.http.post<OrganizationUser>(
      `${this.apiRoot()}/admin/organizations/${org_id}/users`,
      body,
      { headers: this.deskHeaders() },
    );
  }

  removeUser(org_id: string, user_id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiRoot()}/admin/organizations/${org_id}/users/${user_id}`,
      { headers: this.deskHeaders() },
    );
  }

  updateSubscription(org_id: string, tier: string): Observable<Subscription> {
    return this.http.post<Subscription>(
      `${this.apiRoot()}/subscriptions/organizations/${org_id}/upgrade`,
      { org_id, new_tier: tier, billing_cycle: 'monthly' },
      { headers: this.deskHeaders() },
    );
  }

  getSubscription(org_id: string): Observable<Subscription> {
    return this.http.get<Subscription>(
      `${this.apiRoot()}/subscriptions/organizations/${org_id}/subscription`,
      { headers: this.deskHeaders() },
    );
  }
}
