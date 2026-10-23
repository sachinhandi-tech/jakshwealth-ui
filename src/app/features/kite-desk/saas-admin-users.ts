import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { OrganizationUser } from './saas.model';
import { SaasService } from './saas.service';

@Component({
  selector: 'app-saas-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-container">
      <h2>Team Members</h2>

      @if (loading()) {
        <p class="loading">Loading team members...</p>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        <div class="add-user-form">
          <h3>Add Team Member</h3>
          <div class="form-group">
            <input
              [(ngModel)]="newUser.email"
              type="email"
              placeholder="Email address"
              [disabled]="adding()" />
            <input
              [(ngModel)]="newUser.name"
              type="text"
              placeholder="Full name"
              [disabled]="adding()" />
            <select [(ngModel)]="newUser.role" [disabled]="adding()">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button (click)="addUser()" [disabled]="adding()">
              {{ adding() ? 'Adding...' : 'Add Member' }}
            </button>
          </div>
        </div>

        <div class="users-list">
          <h3>Current Members</h3>
          @if (users().length === 0) {
            <p class="no-users">No team members yet</p>
          } @else {
            <table class="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.user_id) {
                  <tr>
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="role-badge" [ngClass]="user.role">
                        {{ user.role }}
                      </span>
                    </td>
                    <td>
                      <span class="status" [ngClass]="user.is_active ? 'active' : 'inactive'">
                        {{ user.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>{{ formatDate(user.created_at) }}</td>
                    <td>
                      <button
                        class="remove-btn"
                        (click)="removeUser(user.user_id)"
                        [disabled]="removingId() === user.user_id">
                        {{ removingId() === user.user_id ? '...' : 'Remove' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .users-container {
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

    .loading, .error, .no-users {
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
    }

    .error {
      background-color: #fee;
      color: #c33;
    }

    .no-users {
      color: #999;
    }

    .add-user-form {
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .form-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    input, select {
      flex: 1;
      min-width: 150px;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    button {
      padding: 0.5rem 1rem;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      background-color: #45a049;
    }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-badge.admin {
      background-color: #2196F3;
      color: white;
    }

    .role-badge.member {
      background-color: #4CAF50;
      color: white;
    }

    .role-badge.viewer {
      background-color: #FF9800;
      color: white;
    }

    .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .status.active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .status.inactive {
      background-color: #ffebee;
      color: #c62828;
    }

    .remove-btn {
      background-color: #f44336;
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .remove-btn:hover:not(:disabled) {
      background-color: #da190b;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaasAdminUsers {
  private readonly saasService = inject(SaasService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly users = signal<OrganizationUser[]>([]);
  readonly adding = signal(false);
  readonly removingId = signal<string | null>(null);

  newUser = {
    email: '',
    name: '',
    role: 'member',
  };

  constructor() {
    this.loadCurrentUserAndUsers();
  }

  private loadCurrentUserAndUsers(): void {
    this.saasService.getCurrentUser().subscribe({
      next: (user) => {
        this.loadUsers(user.org_id);
      },
      error: () => {
        this.error.set('Failed to load user organization');
        this.loading.set(false);
      },
    });
  }

  private loadUsers(org_id: string): void {
    this.saasService.getOrganizationUsers(org_id).subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load team members');
        this.loading.set(false);
      },
    });
  }

  addUser(): void {
    if (!this.newUser.email || !this.newUser.name) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.saasService.getCurrentUser().subscribe((user) => {
      this.addUserWithOrgId(user.org_id);
    });
  }

  private addUserWithOrgId(orgId: string): void {

    this.adding.set(true);
    this.saasService.addUser(orgId, this.newUser).subscribe({
      next: (newUser) => {
        this.users.update((users) => [...users, newUser]);
        this.newUser = { email: '', name: '', role: 'member' };
        this.adding.set(false);
      },
      error: () => {
        this.error.set('Failed to add team member');
        this.adding.set(false);
      },
    });
  }

  removeUser(user_id: string): void {
    this.saasService.getCurrentUser().subscribe((user) => {
      this.removeUserWithOrgId(user.org_id, user_id);
    });
  }

  private removeUserWithOrgId(orgId: string, user_id: string): void {

    this.removingId.set(user_id);
    this.saasService.removeUser(orgId, user_id).subscribe({
      next: () => {
        this.users.update((users) => users.filter((u) => u.user_id !== user_id));
        this.removingId.set(null);
      },
      error: () => {
        this.error.set('Failed to remove team member');
        this.removingId.set(null);
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
