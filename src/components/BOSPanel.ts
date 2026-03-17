import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';

export class BOSPanel extends Panel {
  private notified = false;

  constructor() {
    super({
      id: 'bos',
      title: 'Business Opportunity Score (BOS)',
      infoTooltip: 'Measures convergence of Public Procurement, VC Funding, and Competitor Intelligence',
    });
    this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading();
    // In a real scenario, this would compute based on recent clusters.
    // Stubbing the score presentation.
    const score = 84;
    const trend = 'rising';

    this.checkAndNotify(score);

    const content = h('div', { className: 'bos-container', style: 'padding: 1rem; text-align: center;' },
      h('div', { className: 'bos-score', style: 'font-size: 3rem; font-weight: bold; color: var(--semantic-high);' }, String(score)),
      h('div', { className: 'bos-trend', style: 'font-size: 1.2rem; margin-top: 0.5rem;' }, 
        trend === 'rising' ? '📈 Trend: Strongly Rising' : 'Stable'
      ),
      h('div', { className: 'bos-breakdown', style: 'margin-top: 1rem; text-align: left; font-size: 0.9rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;' },
        h('div', {}, '🏛 Public Procurement: High Activity'),
        h('div', {}, '💰 Impact & Funding: Active Signals'),
        h('div', {}, '⚔ Competitor Expansions: Monitored')
      )
    );
    
    replaceChildren(this.content, content);
  }

  private checkAndNotify(score: number): void {
    if (score >= 80 && !this.notified) {
      this.notified = true;
      console.log(`[Webhook] Triggering Telegram Alert for BOS > 80: ${score}`);
      // Using setTimeout to let UI render first
      setTimeout(() => {
        alert(`🚨 [Telegram Webhook Mock]\n\nHigh Business Opportunity Score Detected!\nBOS: ${score}\n\nSignals: Convergence of Public Procurement & Active VC Funding in Care Tech.\nAction advised: Review SROI memo target.`);
      }, 500);
    }
  }
}
