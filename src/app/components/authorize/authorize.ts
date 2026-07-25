import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthorizationService } from '../../services/authorization/authorization.service';
import { AuthService } from '../../services/auth/auth.service';
import { EnvironmentService } from '../../services/environment/environment.service';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-authorize',
  imports: [RouterLink],
  templateUrl: './authorize.html',
  styleUrl: './authorize.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Authorize implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly userService = inject(UserService);
  private readonly environment = inject(EnvironmentService).getEnvironment();
  private readonly destroyRef = inject(DestroyRef);

  readonly authenticated = signal<boolean | null>(null);
  readonly fullName = signal('');
  readonly logout = signal(false);
  readonly canAccessHome = this.authorization.accessGranted;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const path = this.route.snapshot.url[0]?.path ?? '';

    if (path === 'logout') {
      this.logout.set(true);
      this.authenticated.set(false);
      this.userService.logout();
      return;
    }

    const authError = params.get('error');
    if (authError) {
      this.fail(authError);
      return;
    }

    const redirectSession = this.authService.parseAuthorizeRedirectFragment();
    if (redirectSession) {
      this.authenticated.set(true);
      this.fullName.set(redirectSession.fullName);
      this.authService.completeAuthorizeLogin(redirectSession, this.userService);
      return;
    }

    const authCode = params.get('code');
    const state = params.get('state');
    if (authCode && state) {
      this.authenticated.set(null);
      if (!this.authService.consumeOktaState(state)) {
        this.fail('Invalid OAuth state — please sign in again.');
        return;
      }
      this.authService.exchangeAuthCodeWithRedirect(this.environment.url, authCode, state);
      return;
    }

    const session = this.userService.getSessionData();
    if (session) {
      this.authenticated.set(true);
      this.fullName.set(session.fullName);
      this.authorization
        .ensureAccess({
          redirectOnDenied: '/unauthorised',
          redirectOnAllowed: this.authService.consumeReturnUrl(),
          replaceUrl: true,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
      return;
    }

    this.authenticated.set(false);
  }

  goToLogin(): void {
    this.authService
      .startLoginFromAppConfig(this.router.url, this.environment)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private fail(message: string): void {
    this.authenticated.set(false);
    window.alert(`Authentication failed: ${message}`);
  }
}
