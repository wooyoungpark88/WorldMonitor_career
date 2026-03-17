import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';

export class SROIPanel extends Panel {
  constructor() {
    super({
      id: 'sroi',
      title: 'SROI Memo Practice',
      infoTooltip: 'Social Return on Investment analysis builder',
    });
    this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading();
    
    const content = h('div', { className: 'sroi-container', style: 'padding: 1rem;' },
      h('h4', { style: 'margin-bottom: 0.5rem;' }, '발달장애 돌봄 AI SROI 요약'),
      h('ul', { style: 'list-style: none; padding: 0; margin: 0; font-size: 0.9rem;' },
        h('li', { style: 'margin-bottom: 0.5rem;' }, '• 돌봄 인력 비용 절감: ~30%'),
        h('li', { style: 'margin-bottom: 0.5rem;' }, '• 행동 분석 정확도 향상: 85% -> 95%'),
        h('li', { style: 'margin-bottom: 0.5rem;' }, '• 가족 스트레스 경감 지수: +4.2점')
      ),
      h('button', { 
        style: 'margin-top: 1rem; padding: 0.5rem 1rem; background: var(--bg-accent); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; cursor: pointer; width: 100%;',
        onclick: () => alert('SROI Memo Generator will open here.')
      }, 'Generate SROI Memo')
    );
    
    replaceChildren(this.content, content);
  }
}
