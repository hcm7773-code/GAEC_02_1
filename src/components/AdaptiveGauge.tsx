import React from 'react';
import { TrendingUp, TrendingDown, Target, ShieldCheck, Zap } from 'lucide-react';
import { CEFRLevel } from '../types';
import { THETA_THRESHOLDS } from '../utils/catEngine';

interface AdaptiveGaugeProps {
  theta: number;
  currentLevel: CEFRLevel;
  sem: number;
  lastDelta?: { delta: number; isCorrect: boolean; levelBefore: CEFRLevel; levelAfter: CEFRLevel } | null;
  streak: number;
  questionNumber: number;
  totalQuestions?: number;
}

export const AdaptiveGauge: React.FC<AdaptiveGaugeProps> = ({
  theta,
  currentLevel,
  sem,
  lastDelta,
  streak,
  questionNumber,
  totalQuestions = 10,
}) => {
  // Map theta [-3.0, 3.0] to percentage [0%, 100%]
  const clampedTheta = Math.max(-3.0, Math.min(3.0, theta));
  const percentage = ((clampedTheta + 3.0) / 6.0) * 100;

  // SEM confidence level
  const confidencePercent = Math.min(96, Math.max(35, Math.round((1 - sem) * 100)));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">自適應能力估計 (CAT Engine)</span>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                當前診斷水準：
                <span className="text-indigo-600 font-extrabold ml-1">{currentLevel}</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                θ = {theta >= 0 ? `+${theta.toFixed(2)}` : theta.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Reaction Badge */}
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>連對 {streak} 題</span>
            </div>
          )}

          {lastDelta && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                lastDelta.isCorrect
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {lastDelta.isCorrect ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>難度提升 (+{Math.abs(lastDelta.delta).toFixed(2)})</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>微調鞏固 (-{Math.abs(lastDelta.delta).toFixed(2)})</span>
                </>
              )}
            </div>
          )}

          {/* Test progress */}
          <div className="text-xs text-slate-500">
            題數：<span className="font-semibold text-slate-800">{questionNumber}</span> / {totalQuestions}
          </div>
        </div>
      </div>

      {/* Visual Continuum Bar across CEFR tiers */}
      <div className="relative pt-2 pb-1">
        {/* Tier label indicators */}
        <div className="grid grid-cols-6 text-[10px] text-center font-bold text-slate-400 mb-1">
          <div className={currentLevel === 'A1' ? 'text-indigo-600 font-extrabold' : ''}>A1 (入門)</div>
          <div className={currentLevel === 'A2' ? 'text-indigo-600 font-extrabold' : ''}>A2 (初級)</div>
          <div className={currentLevel === 'B1' ? 'text-indigo-600 font-extrabold' : ''}>B1 (中級)</div>
          <div className={currentLevel === 'B2' ? 'text-indigo-600 font-extrabold' : ''}>B2 (中高)</div>
          <div className={currentLevel === 'C1' ? 'text-indigo-600 font-extrabold' : ''}>C1 (高級)</div>
          <div className={currentLevel === 'C2' ? 'text-indigo-600 font-extrabold' : ''}>C2 (精通)</div>
        </div>

        {/* Track background with gradient bands */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex relative border border-slate-200">
          <div className="w-[16.66%] bg-emerald-100 border-r border-white/50" />
          <div className="w-[16.66%] bg-emerald-200 border-r border-white/50" />
          <div className="w-[16.66%] bg-blue-200 border-r border-white/50" />
          <div className="w-[16.66%] bg-blue-300 border-r border-white/50" />
          <div className="w-[16.66%] bg-purple-200 border-r border-white/50" />
          <div className="w-[16.66%] bg-purple-300" />
        </div>

        {/* Needle indicator for current Theta */}
        <div
          className="absolute top-5 transition-all duration-500 -ml-2.5 flex flex-col items-center"
          style={{ left: `${percentage}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-[9px] font-bold text-white">
            ▲
          </div>
        </div>
      </div>

      {/* Measurement confidence info footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>估計信度 (Confidence)：</span>
          <span className="font-semibold text-slate-700">{confidencePercent}%</span>
          <span className="text-slate-400 font-mono text-[10px]">(SEM: ±{sem.toFixed(2)})</span>
        </div>
        <div className="text-slate-400 hidden sm:block">
          自適應項目反應理論 (2-PL IRT Adaptive Testing) 即時收斂
        </div>
      </div>
    </div>
  );
};
