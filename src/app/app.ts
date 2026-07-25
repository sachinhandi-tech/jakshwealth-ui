import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeaderBar } from './components/app-header-bar/app-header-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeaderBar],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
