import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FunnelChart } from './funnel-chart';
import { TIERED_MEMBERSHIP_FUNNEL_CHART } from './funnel-chart.model';

class ResizeObserverMock {
  observe(): void {
    // Test stub — layout sync is not exercised in unit tests.
  }

  unobserve(): void {
    // Test stub.
  }

  disconnect(): void {
    // Test stub.
  }
}

describe('FunnelChart', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    TestBed.configureTestingModule({
      imports: [FunnelChart],
    });
  });

  it('renders title, subtitle, and tier metrics from the API chart payload', () => {
    const fixture = TestBed.createComponent(FunnelChart);
    fixture.componentRef.setInput('chart', TIERED_MEMBERSHIP_FUNNEL_CHART);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Tiered Membership');
    expect(element.textContent).toContain('Chart explanation goes here');
    expect(element.textContent).toContain('1,000,000');
    expect(element.textContent).toContain('Cigna Members');
    expect(element.textContent).toContain('Tier 1 Provider Claims');
  });

  it('builds one SVG segment per tier', () => {
    const fixture = TestBed.createComponent(FunnelChart);
    fixture.componentRef.setInput('chart', TIERED_MEMBERSHIP_FUNNEL_CHART);
    fixture.detectChanges();

    const blocks = fixture.nativeElement.querySelectorAll(
      '.funnel-chart__block',
    ) as NodeListOf<SVGElement>;

    expect(blocks.length).toBe(4);
    expect(blocks[0].getAttribute('aria-label')).toBe('Cigna Members');
  });

  it('shows a tooltip when a tier is hovered', () => {
    const fixture = TestBed.createComponent(FunnelChart);
    fixture.componentRef.setInput('chart', TIERED_MEMBERSHIP_FUNNEL_CHART);
    fixture.detectChanges();

    const block = fixture.nativeElement.querySelector(
      '.funnel-chart__block',
    ) as SVGPathElement;
    block.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    const tooltip = fixture.nativeElement.querySelector(
      '.funnel-chart__tooltip',
    ) as HTMLElement;

    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain('Cigna Members');
    expect(tooltip.textContent).toContain('1,000,000 total members');
  });
});
