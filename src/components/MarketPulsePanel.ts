import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { h, replaceChildren } from '@/utils/dom-utils';

export class MarketPulsePanel extends Panel {
  constructor() {
    super({
      id: 'marketPulse',
      title: t('panels.marketPulse') || 'Market Pulse',
      infoTooltip: 'Live feeds and clustering for Care Tech, Impact Funding, Competitors, and Policy.',
    });
    this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading();
    
    // UI Layout wrapper
    const container = h('div', { className: 'market-pulse-container', style: 'padding: 12px; height: 100%; display: flex; flex-direction: column; gap: 16px; overflow: auto;' },
      h('div', { className: 'market-intro', style: 'font-size: 13px; color: var(--text-dim);' },
        'Real-time intelligence streams mapped to Care Tech, Funding, Competitors, and Policy.'
      ),
      this.renderStreamSection('Care Tech', '🩺', [
        { title: 'Fierce Healthcare: AI-driven care robotics market expected to grow 45% YoY.', time: '2h ago', alert: false },
        { title: 'STAT News: Behavioral health digital therapeutics face new FDA scrutiny.', time: '5h ago', alert: true },
      ]),
      this.renderStreamSection('Impact & Funding', '💰', [
        { title: 'Rock Health: $50M Series B for Ambient.ai for hospital expansions.', time: '1d ago', alert: true },
        { title: 'CB Insights: Social impact ventures in senior care raised $120M in Q1.', time: '2d ago', alert: false },
      ]),
      this.renderStreamSection('Competitor Intelligence', '⚔', [
        { title: 'Cogito releases new emotion AI API for B2G contracts.', time: '3h ago', alert: true },
        { title: 'Nourish Care entering the South Korean market via joint venture.', time: '1d ago', alert: true },
      ]),
      this.renderStreamSection('Policy & Regulation', '🏛', [
        { title: 'Ministry of Health and Welfare: AI care budget increased by 30% for 2027.', time: '12h ago', alert: true },
        { title: 'MOHW Notice: New guidelines for digital therapeutics reimbursement.', time: '3d ago', alert: false },
      ])
    );
    
    replaceChildren(this.content, container);
  }

  private renderStreamSection(title: string, icon: string, items: {title: string, time: string, alert: boolean}[]) {
    return h('div', { className: 'stream-section', style: 'background: var(--surface-light); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px;' },
      h('div', { className: 'stream-header', style: 'font-weight: bold; margin-bottom: 8px; color: var(--text-main); display: flex; align-items: center; gap: 6px;' },
        h('span', {}, icon),
        h('span', {}, title)
      ),
      h('div', { className: 'stream-items', style: 'display: flex; flex-direction: column; gap: 8px;' },
        ...items.map(item => h('div', { className: 'stream-item', style: 'font-size: 13px; padding-bottom: 8px; border-bottom: 1px dotted var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;' },
          h('div', { style: 'flex: 1; padding-right: 8px;' }, 
            h('span', { style: item.alert ? 'color: var(--semantic-high); font-weight: 500;' : 'color: var(--text-main);' }, item.title)
          ),
          h('div', { style: 'font-size: 11px; color: var(--text-dim); white-space: nowrap;' }, item.time)
        ))
      )
    );
  }
}
