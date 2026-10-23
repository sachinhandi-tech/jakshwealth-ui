export interface Organization {
  org_id: string;
  name: string;
  email: string;
  slug: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  is_active: boolean;
  created_at: string;
}

export interface OrganizationUser {
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  subscription_id: string;
  org_id: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'cancelled';
  start_date: string;
  end_date?: string;
  auto_renew: boolean;
  billing_cycle: 'monthly' | 'annual';
  created_at: string;
}

export interface SubscriptionTierConfig {
  max_users: number;
  max_api_calls_per_month: number;
  max_scans_per_month: number;
  scan_types: string[];
  features: string[];
  api_access: boolean;
  white_label: boolean;
  support: string;
  monthly_price?: number;
}

export interface TierPricingCard {
  tier: 'free' | 'pro' | 'enterprise';
  label: string;
  price: number | string;
  features: string[];
  limitations: string[];
  recommended?: boolean;
}
