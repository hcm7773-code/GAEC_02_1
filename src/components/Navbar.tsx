import React from 'react';
import { GraduationCap, BarChart2, BookOpen, Bookmark, Sparkles, RefreshCw } from 'lucide-react';
import { CEFRLevel, ExamType } from '../types';

interface NavbarProps {
  currentTab: 'test' | 'report' | 'comparison' | 'notebook';
  onTabChange: (tab: 'test' | 'report' | 'comparison' | 'notebook') => void;
  selectedExam: ExamType;
  onExamChange: (exam: ExamType) => void;
  currentTheta: number;
  currentLevel: CEFRLevel;
  savedVocabCount: number;
  isTestActive: boolean;
  onResetTest?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  selectedExam,
  onExamChange,
  currentTheta,
  currentLevel,
  savedVocabCount,
  isTestActive,
  onResetTest,
}) => {
  const getLevelColor = (lvl: CEFRLevel) => {
    switch (lvl) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'B1':
      case 'B2':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C1':
      case 'C2':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Adaptive English</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-600" /> 自適應檢定
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">全民英檢 • 多益 • 托福 • 雅思 • CEFR 即時調難度</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Exam Selector Dropdown */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <label htmlFor="exam-select" className="sr-only">選擇檢定標準</label>
              <select
                id="exam-select"
                value={selectedExam}
                onChange={(e) => onExamChange(e.target.value as ExamType)}
                disabled={isTestActive}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer px-2 py-1 disabled:opacity-60"
              >
                <option value="all">🌐 全檢定綜合 (CEFR)</option>
                <option value="gept">🇹🇼 全民英檢 (GEPT)</option>
                <option value="toeic">🏢 多益商務 (TOEIC)</option>
                <option value="ielts">🇬🇧 雅思學術 (IELTS)</option>
                <option value="toefl">🇺🇸 托福留學 (TOEFL)</option>
              </select>
            </div>

            {/* Current Real-time Ability Indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${getLevelColor(currentLevel)} shadow-sm`}>
              <span className="text-slate-500 text-[11px]">即時水準</span>
              <span className="text-sm font-bold">{currentLevel}</span>
              <span className="font-mono text-[11px] opacity-75">θ:{currentTheta > 0 ? `+${currentTheta.toFixed(2)}` : currentTheta.toFixed(2)}</span>
            </div>

            {/* Tab switchers */}
            <nav className="flex items-center space-x-1">
              <button
                id="nav-tab-test"
                onClick={() => onTabChange('test')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'test'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">測驗演練</span>
              </button>

              <button
                id="nav-tab-notebook"
                onClick={() => onTabChange('notebook')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'notebook'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">單字與錯題</span>
                {savedVocabCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {savedVocabCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-comparison"
                onClick={() => onTabChange('comparison')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'comparison'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">各級對照表</span>
              </button>

              {isTestActive && onResetTest && (
                <button
                  id="nav-reset-test"
                  onClick={onResetTest}
                  title="重新配置測驗"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
