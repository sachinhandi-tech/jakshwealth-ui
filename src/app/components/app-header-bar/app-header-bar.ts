import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthorizationService } from '../../services/authorization/authorization.service';
import { AuthService } from '../../services/auth/auth.service';
import { EnvironmentService } from '../../services/environment/environment.service';
import { UserService } from '../../services/user/user.service';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header-bar',
  imports: [RouterModule],
  templateUrl: './app-header-bar.html',
  styleUrl: './app-header-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderBar {
  private readonly userService = inject(UserService);
  private readonly authorization = inject(AuthorizationService);
  private readonly authService = inject(AuthService);
  private readonly environment = inject(EnvironmentService).getEnvironment();
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly isLoggedIn = this.userService.isLoggedIn;
  readonly accountMenuOpen = signal(false);

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  readonly selectedNav = computed(() => {
    const path = this.currentPath();
    if (path?.startsWith('/home')) return 'Dashboard';
    if (path?.startsWith('/stock-analysis')) return 'Scanner';
    return 'About';
  });

  readonly userInitials = computed(() => {
    const name = this.userService.userSession()?.fullName ?? 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly navItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [{ label: 'About', route: '/about' }];
    if (this.authorization.accessGranted() === true) {
      items.unshift({ label: 'Dashboard', route: '/home' });
      items.push({ label: 'Scanner', route: '/stock-analysis' });
    }
    return items;
  });

  constructor() {
    if (this.isLoggedIn() && this.authorization.accessGranted() === null) {
      this.authorization.probeAccess().subscribe();
    }
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update(open => !open);
  }

  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
  }

  signOut(): void {
    this.closeAccountMenu();
    void this.router.navigateByUrl('/logout');
  }

  login(): void {
    this.authService.startLoginFromAppConfig(this.router.url, this.environment).subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.accountMenuOpen()) return;
    const target = event.target;
    if (target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.closeAccountMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAccountMenu();
  }
}
