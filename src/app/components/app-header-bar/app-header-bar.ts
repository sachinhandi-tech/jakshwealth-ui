import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

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
  private readonly router = inject(Router);

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

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'Dashboard', route: '/home' },
    { label: 'Scanner', route: '/stock-analysis' },
    { label: 'About', route: '/about' },
  ]);
}
