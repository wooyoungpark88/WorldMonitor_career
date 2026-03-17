import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { h, replaceChildren } from '@/utils/dom-utils';

export class DailyBriefPanel extends Panel {
  private checklist = [
    { id: 'morning', label: 'Morning (30m): Corporate Finance 3-Line Memo', checked: true },
    { id: 'lunch', label: 'Lunch (20m): Pricing Benchmark Analysis', checked: false },
    { id: 'evening', label: 'Evening (10m): SROI Computation Practice', checked: false }
  ];

  constructor() {
    super({
      id: 'dailyBrief',
      title: t('panels.dailyBrief') || 'Daily Brief',
      infoTooltip: 'Daily care tech learning habit tracker and summary.',
    });
    this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading();
    
    // Calculate Streak
    const completedCount = this.checklist.filter(item => item.checked).length;
    const progressPercent = Math.round((completedCount / this.checklist.length) * 100);

    const container = h('div', { className: 'brief-container', style: 'padding: 12px; height: 100%; display: flex; flex-direction: column; overflow: auto; gap: 16px;' },
      
      // Streak Widget
      h('div', { style: 'background: var(--surface-light); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;' },
        h('div', { style: 'display: flex; flex-direction: column; gap: 4px;' },
          h('div', { style: 'font-weight: bold; font-size: 14px;' }, '🔥 5 Day Streak!'),
          h('div', { style: 'font-size: 11px; color: var(--text-dim);' }, 'You are on track to meet your weekly goal.')
        ),
        h('div', { style: 'width: 50px; height: 50px; border-radius: 50%; background: conic-gradient(var(--accent) 0%, var(--accent) 80%, var(--border-color) 80%, var(--border-color) 100%); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: var(--text-main);' },
          h('div', { style: 'width: 42px; height: 42px; background: var(--surface-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;' }, '80%')
        )
      ),

      // Checklist
      h('div', { style: 'flex: 1; display: flex; flex-direction: column; gap: 8px;' },
        h('div', { style: 'font-weight: bold; font-size: 14px; margin-bottom: 4px;' }, "Today's Habits"),
        ...this.checklist.map(item => this.renderChecklistItem(item))
      ),

      // Summary Generation
      h('div', { style: 'margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color);' },
        h('div', { style: 'font-size: 11px; color: var(--text-dim); margin-bottom: 8px; text-align: center;' }, `Daily Progress: ${progressPercent}%`),
        h('button', { 
          style: `width: 100%; padding: 10px; border: none; border-radius: 6px; font-weight: bold; cursor: ${completedCount === 3 ? 'pointer' : 'not-allowed'}; background: ${completedCount === 3 ? 'var(--accent)' : 'var(--darken-light)'}; color: ${completedCount === 3 ? 'var(--bg)' : 'var(--text-dim)'}; transition: all 0.2s;`,
          disabled: completedCount < 3,
          onclick: () => alert("Generating AI Summary of Today's Memos...")
        }, 'Generate AI Daily Summary')
      )
    );
    
    replaceChildren(this.content, container);
  }

  private renderChecklistItem(item: {id: string, label: string, checked: boolean}) {
    const el = h('div', { style: 'display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--surface); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; transition: all 0.2s;' },
      h('div', { 
        style: `width: 20px; height: 20px; border-radius: 4px; border: 2px solid ${item.checked ? 'var(--success)' : 'var(--border-strong)'}; display: flex; align-items: center; justify-content: center; background: ${item.checked ? 'var(--success)' : 'transparent'}; color: white; transition: all 0.2s;`
      }, item.checked ? '✓' : ''),
      h('span', { style: `font-size: 13px; color: ${item.checked ? 'var(--text-dim)' : 'var(--text-main)'}; text-decoration: ${item.checked ? 'line-through' : 'none'};` }, item.label)
    );

    el.onclick = () => {
      item.checked = !item.checked;
      this.refresh();
    };

    return el;
  }
}
