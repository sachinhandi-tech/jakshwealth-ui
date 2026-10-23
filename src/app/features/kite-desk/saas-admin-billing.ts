import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Organization, Subscription } from './saas.model';
import { SaasService } from './saas.service';

@Component({
  selector: 'app-saas-admin-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="billing-container">
      <h2>Billing & Invoices</h2>

      @if (loading()) {
        <p class="loading">Loading billing information...</p>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        <div class="billing-overview">
          <div class="card">
            <h3>Current Subscription</h3>
            @if (organization()) {
              <p class="tier" [ngClass]="organization()!.subscription_tier">
                {{ organization()!.subscription_tier | uppercase }}
              </p>
              <p class="email">{{ organization()!.email }}</p>
            }
          </div>

          <div class="card">
            <h3>Billing Cycle</h3>
            @if (subscription()) {
              <p class="billing-cycle">
                {{ subscription()!.billing_cycle | titlecase }}
              </p>
              <p class="dates">
                Started: {{ formatDate(subscription()!.start_date) }}
              </p>
              @if (subscription()!.end_date) {
                <p class="dates">
                  Ends: {{ formatDate(subscription()!.end_date!) }}
                </p>
              }
            }
          </div>

          <div class="card">
            <h3>Auto-Renewal</h3>
            @if (subscription()) {
              <p class="status" [ngClass]="subscription()!.auto_renew ? 'enabled' : 'disabled'">
                {{ subscription()!.auto_renew ? 'Enabled' : 'Disabled' }}
              </p>
            }
          </div>
        </div>

        <div class="invoices-section">
          <h3>Invoices</h3>
          @if (invoices.length > 0) {
          <table class="invoices-table">
            <thead>
              <tr>
                <th>Invoice Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (invoice of invoices; track invoice.id) {
                <tr>
                  <td>{{ formatDate(invoice.date) }}</td>
                  <td>₹{{ invoice.amount }}</td>
                  <td>
                    <span class="status-badge" [ngClass]="invoice.status">
                      {{ invoice.status }}
                    </span>
                  </td>
                  <td>
                    <a href="#" class="download-link">Download PDF</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          }
          @if (invoices.length === 0) {
            <p class="no-invoices">No invoices available yet</p>
          }
        </div>

        <div class="payment-method">
          <h3>Payment Method</h3>
          <div class="card">
            <p class="method-label">Razorpay</p>
            <p class="method-description">Secure online payments via Razorpay</p>
            <button class="update-btn">Update Payment Method</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .billing-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 2rem;
      color: #333;
    }

    h3 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      color: #555;
    }

    .loading, .error, .no-invoices {
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
    }

    .error {
      background-color: #fee;
      color: #c33;
    }

    .no-invoices {
      color: #999;
    }

    .billing-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .tier {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 1rem 0;
    }

    .tier.free {
      color: #666;
    }

    .tier.pro {
      color: #4CAF50;
    }

    .tier.enterprise {
      color: #2196F3;
    }

    .email {
      color: #666;
      font-size: 0.9rem;
    }

    .billing-cycle {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 1rem 0;
      color: #333;
    }

    .dates {
      color: #666;
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    .status {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .status.enabled {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .status.disabled {
      background-color: #ffebee;
      color: #c62828;
    }

    .invoices-section {
      margin-top: 2rem;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .invoices-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    th {
      background-color: #f5f5f5;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid #ddd;
      color: #333;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }

    tr:hover {
      background-color: #fafafa;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.paid {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.pending {
      background-color: #fff3e0;
      color: #e65100;
    }

    .status-badge.failed {
      background-color: #ffebee;
      color: #c62828;
    }

    .download-link {
      color: #2196F3;
      text-decoration: none;
      font-weight: 600;
    }

    .download-link:hover {
      text-decoration: underline;
    }

    .payment-method {
      margin-top: 2rem;
    }

    .method-label {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 1rem 0;
      color: #333;
    }

    .method-description {
      color: #666;
      margin: 0.5rem 0;
    }

    .update-btn {
      padding: 0.75rem 1.5rem;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 1rem;
    }

    .update-btn:hover {
      background-color: #1976D2;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaasAdminBilling {
  private readonly saasService = inject(SaasService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly organization = signal<Organization | null>(null);
  readonly subscription = signal<Subscription | null>(null);

  invoices: { id: string; date: string; amount: number; status: string }[] = [];

  constructor() {
    this.loadCurrentUserAndBillingInfo();
  }

  private loadCurrentUserAndBillingInfo(): void {
    this.saasService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Got user for billing:', user);
        this.loadBillingInfo(user.org_id);
      },
      error: (err) => {
        console.error('Failed to load user for billing:', err);
        this.error.set('Failed to load billing information: ' + (err?.error?.detail || err?.message || 'Unknown error'));
        this.loading.set(false);
      },
    });
  }

  private loadBillingInfo(org_id: string): void {
    this.saasService.getOrganization(org_id).subscribe({
      next: (org) => {
        this.organization.set(org);
        this.loadSubscription(org_id);
      },
      error: () => {
        this.error.set('Failed to load billing information');
        this.loading.set(false);
      },
    });
  }

  private loadSubscription(org_id: string): void {
    this.saasService.getSubscription(org_id).subscribe({
      next: (subscription) => {
        this.subscription.set(subscription);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load subscription details');
        this.loading.set(false);
      },
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private getOrgIdFromUrl(): string | null {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('org_id') || sessionStorage.getItem('org_id');
    }
    return null;
  }
}
