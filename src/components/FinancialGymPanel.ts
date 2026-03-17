import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { h, replaceChildren } from '@/utils/dom-utils';

export class FinancialGymPanel extends Panel {
  private activeTab: 'finance' | 'pricing' | 'sroi' = 'finance';

  constructor() {
    super({
      id: 'financialGym',
      title: t('panels.financialGym') || 'Financial Gym',
      infoTooltip: 'Train your business modeling skills: Corporate Finance, SaaS Pricing, and SROI computations.',
    });
    this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading();
    
    // Top Tabs
    const tabs = h('div', { className: 'gym-tabs', style: 'display: flex; gap: 8px; margin-bottom: 12px; padding: 12px; border-bottom: 1px solid var(--border-color);' },
      this.renderTab('finance', '📈 Corporate Finance'),
      this.renderTab('pricing', '🏷 Pricing Benchmark'),
      this.renderTab('sroi', '💡 SROI Calculator')
    );

    let activeContent;
    if (this.activeTab === 'finance') activeContent = this.renderFinanceContent();
    else if (this.activeTab === 'pricing') activeContent = this.renderPricingContent();
    else if (this.activeTab === 'sroi') activeContent = this.renderSroiContent();

    const container = h('div', { className: 'gym-container', style: 'height: 100%; display: flex; flex-direction: column; overflow: hidden;' },
      tabs,
      h('div', { style: 'flex: 1; padding: 0 12px 12px 12px; overflow: auto;' }, activeContent)
    );
    
    replaceChildren(this.content, container);
  }

  private renderTab(id: 'finance' | 'pricing' | 'sroi', label: string) {
    const isActive = this.activeTab === id;
    const el = h('button', {
      style: `padding: 6px 10px; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; border: 1px solid ${isActive ? 'var(--accent)' : 'transparent'}; background: ${isActive ? 'var(--accent-transparent)' : 'var(--surface-light)'}; color: ${isActive ? 'var(--text-main)' : 'var(--text-dim)'};`,
      onclick: () => {
        this.activeTab = id;
        this.refresh();
      }
    }, label);
    return el;
  }

  private renderFinanceContent() {
    return h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' },
      h('div', { style: 'font-weight: bold; font-size: 14px; margin-bottom: 4px;' }, "Today's Case: Teladoc Health (TDOC)"),
      h('div', { style: 'font-size: 12px; color: var(--text-dim);' }, 'Analyze the Q4 2025 Earnings Call highlighting shift towards value-based care and chronic condition management.'),
      h('div', { style: 'background: var(--surface-light); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; margin-top: 8px;' },
        h('div', { style: 'font-size: 11px; margin-bottom: 12px; font-weight: bold;' }, '📝 3-Line Memo Practice'),
        h('input', { type: 'text', placeholder: '1. Source (Revenue Driver)', style: 'width: 100%; padding: 8px; margin-bottom: 8px; background: var(--bg); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;' }),
        h('input', { type: 'text', placeholder: '2. Cost (Largest Expense)', style: 'width: 100%; padding: 8px; margin-bottom: 8px; background: var(--bg); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;' }),
        h('input', { type: 'text', placeholder: '3. Moat (Competitive Advantage)', style: 'width: 100%; padding: 8px; margin-bottom: 12px; background: var(--bg); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;' }),
        h('button', { style: 'width: 100%; padding: 8px; background: var(--accent); color: var(--bg); border: none; border-radius: 4px; font-weight: bold; cursor: pointer;' }, 'Save to Daily Brief')
      )
    );
  }

  private renderPricingContent() {
    return h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' },
      h('div', { style: 'font-weight: bold; font-size: 14px; margin-bottom: 4px;' }, 'Pricing Model Benchmarks'),
      h('div', { style: 'font-size: 12px; color: var(--text-dim);' }, 'Compare typical B2G / B2B care tech models.'),
      h('div', { style: 'background: var(--surface-light); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 8px;' },
        h('div', { style: 'display: flex; justify-content: space-between; font-size: 13px;' }, h('span', {}, '조달청 평균 단가:'), h('strong', {}, '₩1,500,000 / 단위')),
        h('div', { style: 'display: flex; justify-content: space-between; font-size: 13px;' }, h('span', {}, '경쟁사 A (SaaS):'), h('strong', {}, '₩30,000 / 사용자 / 월')),
        h('div', { style: 'display: flex; justify-content: space-between; font-size: 13px;' }, h('span', {}, '경쟁사 B (Hardware bundled):'), h('strong', {}, '₩2,800,000 + 유지보수 10%')),
        h('hr', { style: 'border: none; border-top: 1px dotted var(--border-color); margin: 8px 0;' }),
        h('div', { style: 'display: flex; justify-content: space-between; font-size: 13px; color: var(--accent); font-weight: bold;' }, h('span', {}, '💡 CareVia / 호시담:'), h('strong', {}, '₩???,??? / 월 (작성 필)'))
      )
    );
  }

  private renderSroiContent() {
    return h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' },
      h('div', { style: 'font-weight: bold; font-size: 14px; margin-bottom: 4px;' }, 'Social Return on Investment Calculator'),
      h('div', { style: 'font-size: 12px; color: var(--text-dim);' }, 'Translate social impact into economic value.'),
      h('div', { style: 'background: var(--surface-light); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; margin-top: 8px;' },
        h('div', { style: 'font-size: 11px; margin-bottom: 8px; color: var(--text-dim);' }, 'Input AI intervention impact:'),
        h('input', { type: 'number', placeholder: 'Reduction in night supervision hours (%)', style: 'width: 100%; padding: 8px; margin-bottom: 8px; background: var(--bg); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;' }),
        h('input', { type: 'number', placeholder: 'Increase in behavior intervention hit-rate (%)', style: 'width: 100%; padding: 8px; margin-bottom: 12px; background: var(--bg); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;' }),
        h('div', { style: 'padding: 10px; background: var(--darken-light); border-radius: 4px; border-left: 3px solid var(--semantic-high); margin-bottom: 12px;' },
          h('div', { style: 'font-size: 11px; margin-bottom: 4px;' }, 'Estimated SROI Generation'),
          h('strong', { style: 'font-size: 16px; color: var(--semantic-high);' }, 'Expected 3.2x ROI for Public Sector')
        ),
        h('button', { style: 'width: 100%; padding: 8px; background: var(--text-main); color: var(--bg); border: none; border-radius: 4px; font-weight: bold; cursor: pointer;' }, 'Generate SROI Output Memo')
      )
    );
  }
}
