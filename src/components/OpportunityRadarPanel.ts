import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { h, replaceChildren } from '@/utils/dom-utils';

export class OpportunityRadarPanel extends Panel {
  private notified = false;

  constructor() {
    super({
      id: 'opportunityRadar',
      title: t('panels.opportunityRadar') || 'Opportunity Radar',
      infoTooltip: 'Opportunity Score = Policy(0.4) + Funding(0.3) + Competitors(0.3) | Also tracks Public Procurement.',
    });
    this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading();
    
    // Calculate Score
    const s1 = 85; // Policy / Budget changes
    const s2 = 90; // Funding influx
    const s3 = 60; // Competitor movement
    
    const score = Math.round(s1 * 0.4 + s2 * 0.3 + s3 * 0.3);
    
    // Trigger mock notification
    this.checkAndNotify(score);

    const container = h('div', { className: 'radar-container', style: 'padding: 12px; height: 100%; display: flex; flex-direction: column; overflow: auto;' },
      // Top section: Score Formula
      h('div', { className: 'score-section', style: 'background: var(--surface-light); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: center;' },
        h('div', { style: 'font-size: 13px; color: var(--text-dim); margin-bottom: 8px;' }, 'Opportunity Convergence Score'),
        h('div', { style: `font-size: 42px; font-weight: bold; color: ${score >= 70 ? 'var(--semantic-high)' : 'var(--text-main)'}; line-height: 1; margin-bottom: 12px;` }, `${score}`),
        
        // Breakdown
        h('div', { style: 'display: flex; gap: 8px; justify-content: center; font-size: 11px; flex-wrap: wrap;' },
          h('span', { style: 'padding: 4px 8px; background: var(--darken-light); border-radius: 4px;' }, `S1 Policy (40%): ${s1}`),
          h('span', { style: 'padding: 4px 8px; background: var(--darken-light); border-radius: 4px;' }, `S2 Funding (30%): ${s2}`),
          h('span', { style: 'padding: 4px 8px; background: var(--darken-light); border-radius: 4px;' }, `S3 Rivals (30%): ${s3}`)
        )
      ),
      
      // Bottom section: Procurement Tracker
      h('div', { className: 'procurement-tracker', style: 'flex: 1;' },
        h('div', { style: 'font-weight: bold; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;' },
          h('span', {}, '🏛'), h('span', {}, 'Public Procurement Tracker (g2b.go.kr)')
        ),
        
        h('div', { style: 'display: flex; flex-direction: column; gap: 8px;' },
          this.renderProcurementItem('AI 기반 취약계층 비대면 돌봄 서비스 구축', '보건복지부', '₩ 850M', 'D-5', 'High'),
          this.renderProcurementItem('지자체 스마트 경로당 헬스케어 시스템 도입', 'OO시청', '₩ 320M', 'D-12', 'Medium'),
          this.renderProcurementItem('중증장애인 도전행동 영상분석 솔루션 실증', '과기정통부', '₩ 1,200M', 'D-1', 'High'),
          this.renderProcurementItem('보건소 모바일 헬스케어 앱 유지보수', '질병관리청', '₩ 150M', 'D-20', 'Low')
        )
      )
    );
    
    replaceChildren(this.content, container);
  }

  private renderProcurementItem(title: string, agency: string, budget: string, deadline: string, fit: 'High' | 'Medium' | 'Low') {
    const fitColors = {
      'High': 'var(--success)',
      'Medium': 'var(--warning)',
      'Low': 'var(--text-dim)'
    };
    
    return h('div', { style: 'padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface); display: flex; flex-direction: column; gap: 6px;' },
      h('div', { style: 'font-size: 13px; font-weight: 500; color: var(--text-main);' }, title),
      h('div', { style: 'display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-dim);' },
        h('div', { style: 'display: flex; gap: 8px;' },
          h('span', {}, agency),
          h('span', { style: 'color: var(--text-main);' }, budget)
        ),
        h('div', { style: 'display: flex; gap: 8px; align-items: center;' },
          h('span', { style: 'color: var(--danger); font-weight: bold;' }, deadline),
          h('span', { style: `padding: 2px 6px; border-radius: 4px; background: ${fitColors[fit]}; color: #fff; font-size: 9px; text-transform: uppercase;` }, fit)
        )
      )
    );
  }

  private checkAndNotify(score: number): void {
    if (score >= 70 && !this.notified) {
      this.notified = true;
      setTimeout(() => {
        alert(`🚨 [Telegram Webhook Mock]\n\nHigh Opportunity Score Detected!\nScore: ${score}\n\nSignals: High Policy/Budget support (S1) converging with major VC funding (S2).\nAction advised: Check the Latest 'AI Care' procurement from the Ministry of Health and Welfare.`);
      }, 500);
    }
  }
}
