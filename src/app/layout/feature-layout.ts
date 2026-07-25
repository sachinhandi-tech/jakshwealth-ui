import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-feature-layout',
  imports: [RouterOutlet],
  templateUrl: './feature-layout.html',
  styleUrl: './feature-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureLayout {}
