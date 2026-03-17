import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';

export class PricingBenchmarkPanel extends Panel {
  constructor() {
    super({
      id: 'pricing',
      title: 'Pricing Benchmark',
      infoTooltip: 'Compare competitor pricing and public procurement budgets',
    });
    this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading();
    
    const content = h('div', { className: 'pricing-container', style: 'padding: 1rem;' },
      h('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;' },
        h('span', {}, '조달청 평균 단가:'),
        h('strong', {}, '₩1,500,000 / 단위')
      ),
      h('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;' },
        h('span', {}, '경쟁사 A (SaaS):'),
        h('strong', {}, '₩30,000 / 월')
      ),
      h('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;' },
        h('span', {}, '경쟁사 B (Hardware):'),
        h('strong', {}, '₩2,800,000')
      ),
      h('div', { style: 'margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);' },
        '* 기반 데이터: Public Procurement & Competitor Intelligence 트랙'
      )
    );
    
    replaceChildren(this.content, content);
  }
}
