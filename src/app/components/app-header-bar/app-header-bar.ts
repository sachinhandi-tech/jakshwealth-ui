import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header-bar',
  imports: [RouterModule],
  templateUrl: './app-header-bar.html',
  styleUrl: './app-header-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderBar {}
