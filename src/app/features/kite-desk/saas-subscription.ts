import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Organization, Subscription, TierPricingCard } from './saas.model';
import { SaasService } from './saas.service';

@Component({
  selector: 'app-saas-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subscription-container">
      <h2>Subscription Settings</h2>

      @if (loading()) {
        <p class="loading">Loading subscription details...</p>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        <div class="current-tier">
          <h3>Current Plan</h3>
          <div class="tier-badge" [ngClass]="currentTier()">
            {{ currentTier() | uppercase }}
          </div>
          @if (subscription()) {
            <p>Billing Cycle: {{ subscription()!.billing_cycle }}</p>
            <p>Status: {{ subscription()!.status }}</p>
          }
        </div>

        <div class="pricing-cards">
          <h3>Upgrade Options</h3>
          <div class="cards-grid">
            @for (card of pricingCards; track card.tier) {
              <div class="pricing-card" [ngClass]="{ recommended: card.recommended }">
                <h4>{{ card.label }}</h4>
                <div class="price">
                  @if (typeof card.price === "number") {
                    ₹{{ card.price }}<span class="period">/month</span>
                  } @else {
                    {{ card.price }}
                  }
                </div>
                <div class="features">
                  <h5>Features:</h5>
                  <ul>
                    @for (feature of card.features; track feature) {
                      <li>✓ {{ feature }}</li>
                    }
                  </ul>
                </div>
                <div class="limitations">
                  <h5>Limitations:</h5>
                  <ul>
                    @for (limit of card.limitations; track limit) {
                      <li>{{ limit }}</li>
                    }
                  </ul>
                </div>
                @if (card.tier !== currentTier()) {
                  <button
                    class="upgrade-btn"
                    (click)="upgradeTier(card.tier)"
                    [disabled]="upgrading()">
                    {{ upgrading() ? 'Processing...' : 'Upgrade Now' }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .subscription-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 2rem;
      color: #333;
    }

    .loading, .error {
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
    }

    .error {
      background-color: #fee;
      color: #c33;
    }

    .current-tier {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .tier-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
      margin: 1rem 0;
      font-size: 1.1rem;
    }

    .tier-badge.free {
      background-color: #e0e0e0;
      color: #333;
    }

    .tier-badge.pro {
      background-color: #4CAF50;
      color: white;
    }

    .tier-badge.enterprise {
      background-color: #2196F3;
      color: white;
    }

    .pricing-cards {
      margin-top: 2rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .pricing-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      background: white;
      transition: box-shadow 0.3s;
    }

    .pricing-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .pricing-card.recommended {
      border: 2px solid #4CAF50;
      background: #f9fff9;
    }

    .price {
      font-size: 1.8rem;
      font-weight: bold;
      color: #333;
      margin: 1rem 0;
    }

    .period {
      font-size: 0.8rem;
      font-weight: normal;
      color: #666;
    }

    .features, .limitations {
      margin-top: 1rem;
    }

    .features h5, .limitations h5 {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 0.9rem;
    }

    li {
      padding: 0.3rem 0;
      color: #555;
    }

    .upgrade-btn {
      width: 100%;
      padding: 0.75rem;
      margin-top: 1.5rem;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .upgrade-btn:hover:not(:disabled) {
      background-color: #45a049;
    }

    .upgrade-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaasSubscription {
  private readonly saasService = inject(SaasService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly currentTier = signal<'free' | 'pro' | 'enterprise'>('free');
  readonly subscription = signal<Subscription | null>(null);
  readonly upgrading = signal(false);
  

  pricingCards: TierPricingCard[] = [
    {
      tier: 'free',
      label: 'Free',
      price: 0,
      features: ['Signal scanning', 'Dashboard', 'Nifty 100 short-term'],
      limitations: ['1 user', '100 scans/month', 'Community support'],
    },
    {
      tier: 'pro',
      label: 'Pro',
      price: 499,
      recommended: true,
      features: [
        'Signal scanning',
        'Dashboard',
        'Trade tracking',
        'Performance analytics',
        'Nifty 100 (both terms)',
        'API access',
      ],
      limitations: ['10 users', '1000 scans/month', 'Email support'],
    },
    {
      tier: 'enterprise',
      label: 'Enterprise',
      price: 'Custom',
      features: [
        'Unlimited users',
        'Unlimited scans',
        'Custom strategies',
        'All NSE stocks',
        'White-label support',
        'Priority support',
      ],
      limitations: ['Custom pricing', 'Dedicated support'],
    },
  ];

  constructor() {
    this.loadCurrentUserAndSubscription();
  }

  private loadCurrentUserAndSubscription(): void {
    this.saasService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentTier.set(user.subscription_tier as 'free' | 'pro' | 'enterprise');
        this.loadSubscription(user.org_id);
      },
      error: () => {
        this.error.set('Failed to load subscription');
        this.loading.set(false);
      },
    });
  }

  private loadSubscription(org_id: string): void {
    this.saasService.getOrganization(org_id).subscribe({
      next: (org) => {
        this.currentTier.set(org.subscription_tier);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load subscription details');
        this.loading.set(false);
      },
    });
  }

  upgradeTier(tier: 'free' | 'pro' | 'enterprise'): void {
    this.saasService.getCurrentUser().subscribe((user) => {
      this.upgradeTierWithOrgId(user.org_id, tier);
    });
  }

  private upgradeTierWithOrgId(orgId: string, tier: 'free' | 'pro' | 'enterprise'): void {

    this.upgrading.set(true);
    this.saasService.updateSubscription(orgId, tier).subscribe({
      next: () => {
        this.currentTier.set(tier);
        this.upgrading.set(false);
      },
      error: () => {
        this.error.set('Failed to upgrade subscription');
        this.upgrading.set(false);
      },
    });
  }

  private getOrgIdFromUrl(): string | null {
    // Extract org_id from URL query parameter or session storage
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('org_id') || sessionStorage.getItem('org_id');
    }
    return null;
  }
}

export { SaasSubscription as default };
