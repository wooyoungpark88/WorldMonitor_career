import { useMemo } from 'react';
import { useStudyStore } from '../../stores/studyStore';

interface Dimension {
  key: string;
  label: string;
  types: string[];
}

const DIMENSIONS: Dimension[] = [
  { key: 'financial', label: '재무 분석', types: ['financial'] },
  { key: 'pricing', label: '가격 설계', types: ['pricing'] },
  { key: 'impact', label: '임팩트', types: ['sroi'] },
  { key: 'policy', label: '정책/규제', types: ['regulation', 'custom'] },
  { key: 'competition', label: '경쟁 분석', types: ['benchmark', 'pitch'] },
];

const MAX_SESSIONS = 10;

export default function CompetencyRadar() {
  const completedSessions = useStudyStore((s) => s.completedSessions);

  const scores = useMemo(() => {
    return DIMENSIONS.map((dim) => {
      const count = completedSessions.filter((s) => dim.types.includes(s.type)).length;
      return Math.min(1, count / MAX_SESSIONS);
    });
  }, [completedSessions]);

  const n = DIMENSIONS.length;
  const cx = 100;
  const cy = 100;
  const r = 80;

  const angleStep = (2 * Math.PI) / n;

  const getPoint = (index: number, scale: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return { x: cx + r * scale * Math.cos(angle), y: cy + r * scale * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = scores.map((s, i) => getPoint(i, s));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  if (completedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <p className="text-sm">아직 완료된 세션이 없습니다</p>
        <p className="text-xs mt-1">세션을 완료하면 역량 레이더가 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="220" viewBox="0 0 200 200">
        {gridLevels.map((level) => {
          const points = Array.from({ length: n }, (_, i) => {
            const p = getPoint(i, level);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={points} fill="none" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" />;
        })}

        {Array.from({ length: n }, (_, i) => {
          const p = getPoint(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" />;
        })}

        <path d={dataPath} fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" />

        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
        ))}

        {DIMENSIONS.map((dim, i) => {
          const p = getPoint(i, 1.2);
          return (
            <text key={dim.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="9" fontWeight="600">
              {dim.label}
            </text>
          );
        })}
      </svg>

      <div className="grid grid-cols-5 gap-2 mt-3 w-full">
        {DIMENSIONS.map((dim) => {
          const count = completedSessions.filter((s) => dim.types.includes(s.type)).length;
          return (
            <div key={dim.key} className="text-center">
              <div className="text-xs font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-[9px] text-gray-400">{dim.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
