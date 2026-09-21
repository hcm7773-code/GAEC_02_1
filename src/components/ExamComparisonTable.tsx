import React, { useState } from 'react';
import { BookOpen, Info, Check, Search, Sparkles } from 'lucide-react';
import { CEFRLevel } from '../types';
import { EXAM_COMPARISONS } from '../utils/catEngine';

interface ExamComparisonTableProps {
  currentLevel?: CEFRLevel;
  onSelectLevelBenchmark?: (level: CEFRLevel) => void;
}

export const ExamComparisonTable: React.FC<ExamComparisonTableProps> = ({
  currentLevel = 'B1',
  onSelectLevelBenchmark,
}) => {
  const [highlightLevel, setHighlightLevel] = useState<CEFRLevel>(currentLevel);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">國際英語檢定標準對照矩陣</h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              參照台灣教育部、LTTC 語言測驗中心、ETS 與英國文化協會之標準對照架構，展示 CEFR 與全民英檢 (GEPT)、多益 (TOEIC)、托福 (TOEFL iBT)、雅思 (IELTS) 的精確對應。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">目前診斷水準：</span>
            <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs">
              {currentLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Level Quick Select Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {EXAM_COMPARISONS.map((item) => (
          <button
            key={item.cefr}
            onClick={() => setHighlightLevel(item.cefr)}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              highlightLevel === item.cefr
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="text-sm font-extrabold">{item.cefr}</div>
            <div className="text-[11px] opacity-80 mt-0.5">{item.gept}</div>
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-4 px-4 w-24">CEFR 等級</th>
                <th className="py-4 px-4 w-28">CAT θ 難度區間</th>
                <th className="py-4 px-4">全民英檢 (GEPT)</th>
                <th className="py-4 px-4">多益 (TOEIC)</th>
                <th className="py-4 px-4">雅思 (IELTS)</th>
                <th className="py-4 px-4">托福 (TOEFL iBT)</th>
                <th className="py-4 px-6 min-w-[280px]">語言核心能力敘述 (Can-do Statements)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {EXAM_COMPARISONS.map((row) => {
                const isCurrent = row.cefr === currentLevel;
                const isSelected = row.cefr === highlightLevel;

                return (
                  <tr
                    key={row.cefr}
                    onClick={() => setHighlightLevel(row.cefr)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 font-medium text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="py-4 px-4 font-bold flex items-center gap-1.5">
                      <span className="text-sm">{row.cefr}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-600 text-white font-extrabold">
                          當前
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">{row.thetaRange}</td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{row.gept}</td>
                    <td className="py-4 px-4 font-semibold text-indigo-700">{row.toeicRange}</td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{row.ieltsRange}</td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{row.toeflRange}</td>
                    <td className="py-4 px-6 leading-relaxed text-slate-600 text-xs">
                      {row.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Benchmark Deep-dive */}
      {highlightLevel && (
        <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>以此級別（CEFR {highlightLevel}）作為自適應測驗起點？</span>
            </h4>
            <p className="text-xs text-indigo-800/80">
              若已知目標考科水準，可設定 CAT 初始題目難度聚焦此區間，大幅縮短估計時間。
            </p>
          </div>

          {onSelectLevelBenchmark && (
            <button
              onClick={() => onSelectLevelBenchmark(highlightLevel)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
            >
              設定為測驗起點 ({highlightLevel})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
