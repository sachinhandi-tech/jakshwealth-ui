import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface AboutFeature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-about',
  imports: [RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  readonly features: AboutFeature[] = [
    {
      icon: '📐',
      title: 'Structural Analysis',
      description:
        'Detect higher-high and higher-low patterns that signal institutional accumulation and trend continuation.',
    },
    {
      icon: '🎯',
      title: 'Scored Recommendations',
      description:
        'Every candidate is ranked by a composite score — pattern strength, breakout proximity, volume, and RSI confluence.',
    },
    {
      icon: '🇮🇳',
      title: 'NSE Focused',
      description:
        'Built specifically for Indian equities with bundled NSE universe support and custom symbol scanning.',
    },
    {
      icon: '⚡',
      title: 'Weekly Cadence',
      description:
        'Weekly HH-HL structure analysis aligned with swing trading timeframes — find setups before they break out.',
    },
  ];
}
