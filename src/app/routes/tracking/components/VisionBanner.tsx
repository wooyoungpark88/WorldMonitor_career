import { useState } from 'react';
import { newsArticles } from '../../../../mocks/newsData';

type StatFilter = 'all' | 'high-impact' | 'procurement';

interface VisionBannerProps {
  activeStatFilter?: StatFilter | null;
  onStatClick?: (filter: StatFilter) => void;
}

const VisionBanner = ({ activeStatFilter, onStatClick }: VisionBannerProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const totalSignals = newsArticles.length;
  const opportunities = newsArticles.filter((a) => a.analysis.impactLevel === 'high').length;

  const recentProcurements = newsArticles.filter(
    (a) => a.type === 'procurement' && a.daysAgo <= 3
  ).length;

  const handleStatClick = (filter: StatFilter) => {
    onStatClick?.(filter);
  };

  if (collapsed) {
    return (
      <div
        className="rounded-2xl px-5 py-3 flex items-center justify-between mb-5 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #08140f 0%, #0f221a 100%)' }}
        onClick={() => setCollapsed(false)}
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2ec4a9]" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
          <span className="text-[#2ec4a9] text-xs font-bold tracking-widest uppercase">커리어 비전</span>
          <span className="text-white/60 text-sm font-semibold italic">팔릴수록 세상이 더 좋아지는.</span>
        </div>
        <span className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60">
          <i className="ri-expand-diagonal-line text-sm" />
        </span>
      </div>
    );
  }

  const statCardBase =
    'rounded-xl px-3 py-2.5 relative overflow-hidden cursor-pointer transition-all duration-200';

  const isActive = (f: StatFilter) => activeStatFilter === f;
  const hasAnyFilter = activeStatFilter !== null && activeStatFilter !== undefined;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-5 relative"
      style={{
        background: 'linear-gradient(135deg, #08140f 0%, #0f221a 55%, #0b1d16 100%)',
        animation: 'fadeInUp 0.5s ease-out',
      }}
    >
      {/* Decorative background circles */}
      <div
        className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      >
        {[80, 56, 32].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border border-[#2ec4a9] -translate-x-1/2 -translate-y-1/2"
            style={{
              width: size,
              height: size,
              opacity: 0.04 + i * 0.03,
              top: '50%',
              left: '50%',
            }}
          />
        ))}
        <div className="w-2 h-2 rounded-full bg-[#2ec4a9]" style={{ opacity: 0.2 }} />
      </div>

      {/* Dot grid decoration */}
      <div className="absolute left-0 top-0 w-24 h-full pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(46,196,169,0.12) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      <div className="relative px-6 pt-5 pb-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-[#2ec4a9]"
              style={{ animation: 'pulseGlow 2.5s ease-in-out infinite' }}
            />
            <span className="text-[#2ec4a9] text-[11px] font-bold tracking-[0.2em] uppercase">커리어 비전</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <i className="ri-subtract-line text-sm" />
          </button>
        </div>

        {/* Main phrase */}
        <div className="mb-5" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Left: 팔릴수록 */}
            <div className="shrink-0">
              <p
                className="font-black leading-none tracking-tight"
                style={{
                  fontSize: 'clamp(1.6rem, 5vw, 2rem)',
                  color: '#2ec4a9',
                  textShadow: '0 0 40px rgba(46,196,169,0.4)',
                }}
              >
                팔릴수록
              </p>
            </div>

            {/* Connector */}
            <div className="flex sm:flex-row flex-row items-center gap-1.5 sm:flex-1 sm:px-2 sm:min-w-12">
              <div className="flex items-center gap-1">
                <div
                  className="h-px rounded-full"
                  style={{
                    width: 32,
                    background: 'linear-gradient(90deg, #2ec4a9, transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'flowRight 2.5s linear infinite',
                  }}
                />
                <span className="text-[#2ec4a9] text-xs leading-none">▶</span>
              </div>
              <div className="hidden sm:flex flex-1 items-center gap-1.5">
                <div
                  className="flex-1 h-px rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #2ec4a9 0%, #2ec4a9 60%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'flowRight 2.5s linear infinite',
                  }}
                />
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-[#2ec4a9]"
                      style={{ opacity: 0.3 + i * 0.3, animation: `pulseGlow 1.5s ease-in-out infinite ${i * 0.3}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: 세상이 더 좋아지는 */}
            <div className="shrink-0">
              <p
                className="font-black leading-none tracking-tight text-white"
                style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)' }}
              >
                세상이 더 좋아지는.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mb-3" />

        {/* Stats grid — clickable */}
        <div className="grid grid-cols-3 gap-2">

          {/* 시그널 추적 */}
          <button
            onClick={() => handleStatClick('all')}
            className={`${statCardBase} text-left ${
              isActive('all')
                ? 'ring-2 ring-[#2ec4a9]/60 scale-[1.02]'
                : hasAnyFilter
                ? 'opacity-50 hover:opacity-80'
                : 'hover:scale-[1.02]'
            }`}
            style={{
              background: isActive('all')
                ? 'rgba(46,196,169,0.14)'
                : 'rgba(46,196,169,0.07)',
              border: isActive('all')
                ? '1px solid rgba(46,196,169,0.5)'
                : '1px solid rgba(46,196,169,0.18)',
            }}
            title="전체 시그널 보기"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-radar-line text-[#2ec4a9] text-xs" />
                </span>
                <span className="text-[9px] text-[#2ec4a9]/60 font-bold uppercase tracking-widest whitespace-nowrap">
                  시그널
                </span>
              </div>
              {isActive('all') && (
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-check-line text-[#2ec4a9] text-xs" />
                </span>
              )}
            </div>
            <p
              className="font-black leading-none text-[#2ec4a9]"
              style={{
                fontSize: '1.75rem',
                textShadow: '0 0 24px rgba(46,196,169,0.5)',
              }}
            >
              {totalSignals}
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              {isActive('all') ? '전체 표시 중' : '추적 중'}
            </p>
          </button>

          {/* HIGH 기회 */}
          <button
            onClick={() => handleStatClick('high-impact')}
            className={`${statCardBase} text-left ${
              isActive('high-impact')
                ? 'ring-2 ring-emerald-400/60 scale-[1.02]'
                : hasAnyFilter
                ? 'opacity-50 hover:opacity-80'
                : 'hover:scale-[1.02]'
            }`}
            style={{
              background: isActive('high-impact')
                ? 'rgba(52,211,153,0.14)'
                : 'rgba(52,211,153,0.07)',
              border: isActive('high-impact')
                ? '1px solid rgba(52,211,153,0.5)'
                : '1px solid rgba(52,211,153,0.18)',
            }}
            title="HIGH 임팩트 기사 필터"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-focus-3-line text-emerald-400 text-xs" />
                </span>
                <span className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest">
                  HIGH
                </span>
              </div>
              {isActive('high-impact') && (
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-check-line text-emerald-400 text-xs" />
                </span>
              )}
            </div>
            <p
              className="font-black leading-none text-emerald-400"
              style={{
                fontSize: '1.75rem',
                textShadow: '0 0 24px rgba(52,211,153,0.5)',
              }}
            >
              {opportunities}
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              {isActive('high-impact') ? '필터 적용 중' : '기회 발견'}
            </p>
          </button>

          {/* 신규 공고 */}
          <button
            onClick={() => handleStatClick('procurement')}
            className={`${statCardBase} text-left ${
              isActive('procurement')
                ? 'ring-2 ring-orange-400/60 scale-[1.02]'
                : hasAnyFilter
                ? 'opacity-50 hover:opacity-80'
                : 'hover:scale-[1.02]'
            }`}
            style={{
              background: isActive('procurement')
                ? 'rgba(251,146,60,0.14)'
                : 'rgba(251,146,60,0.07)',
              border: isActive('procurement')
                ? '1px solid rgba(251,146,60,0.5)'
                : '1px solid rgba(251,146,60,0.18)',
            }}
            title="조달/정책 기사 필터"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-file-add-line text-orange-400 text-xs" />
                </span>
                <span className="text-[9px] text-orange-400/60 font-bold uppercase tracking-widest">
                  신규
                </span>
              </div>
              {isActive('procurement') && (
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-check-line text-orange-400 text-xs" />
                </span>
              )}
            </div>
            <p
              className="font-black leading-none text-orange-400"
              style={{
                fontSize: '1.75rem',
                textShadow: '0 0 24px rgba(251,146,60,0.4)',
              }}
            >
              {recentProcurements}
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              {isActive('procurement') ? '필터 적용 중' : '최근 3일 공고'}
            </p>
          </button>
        </div>

        {/* Active filter hint */}
        {hasAnyFilter && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 flex items-center justify-center">
              <i className="ri-arrow-down-line text-[#2ec4a9]/50 text-xs" />
            </span>
            <span className="text-[10px] text-[#2ec4a9]/50 font-medium">
              {activeStatFilter === 'all' && '전체 기사 표시 중'}
              {activeStatFilter === 'high-impact' && `HIGH 임팩트 기사 ${opportunities}건 필터 적용 중`}
              {activeStatFilter === 'procurement' && '정책/조달 기사 필터 적용 중'}
            </span>
            <span className="text-[10px] text-white/20">— 카드 재클릭 시 해제</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionBanner;
