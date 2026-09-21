import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Target,
  Brain,
  Sliders,
  CheckCircle2,
  Play,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';
import { CEFRLevel, ExamType, TestMode } from '../types';

interface TestSetupCardProps {
  onStartTest: (config: {
    examType: ExamType;
    testMode: TestMode;
    startLevel: CEFRLevel;
    questionCount: number;
    useAIAdaptive: boolean;
  }) => void;
  defaultExamType?: ExamType;
  lastTestSummary?: { level: CEFRLevel; toeic: number; gept: string } | null;
}

export const TestSetupCard: React.FC<TestSetupCardProps> = ({
  onStartTest,
  defaultExamType = 'all',
  lastTestSummary,
}) => {
  const [examType, setExamType] = useState<ExamType>(defaultExamType);
  const [testMode, setTestMode] = useState<TestMode>('practice');
  const [startLevel, setStartLevel] = useState<CEFRLevel>('B1');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [useAIAdaptive, setUseAIAdaptive] = useState<boolean>(true);

  const handleStart = () => {
    onStartTest({
      examType,
      testMode,
      startLevel,
      questionCount,
      useAIAdaptive,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Welcome & Overview Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>項目反應理論 (Item Response Theory) 自適應測驗引擎</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            英語各級檢定即時自適應測驗練習平台
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed">
            系統依據您每題的作答正誤、反應時間與能力參數 θ 即時向上或向下調整題目難度。擺脫傳統固定卷盲測，以最少題數精確診斷全民英檢、多益、雅思、托福與 CEFR 水準。
          </p>
        </div>

        {lastTestSummary && (
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="text-xs text-slate-500 font-medium">上次自適應測驗成績：</span>
                <span className="text-sm font-bold text-slate-900 ml-1">
                  CEFR {lastTestSummary.level} • 多益約 {lastTestSummary.toeic} 分 • {lastTestSummary.gept}
                </span>
              </div>
            </div>
            <span className="text-xs text-indigo-700 font-semibold">可設定為起點延續訓練</span>
          </div>
        )}
      </div>

      {/* Setup Form Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
        {/* Step 1: Choose Exam Focus */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">1</span>
            <span>選擇目標檢定架構 (Exam Target)</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'all', title: '綜合 CEFR', desc: 'A1-C2 全方位' },
              { id: 'gept', title: '全民英檢', desc: '初級 / 中級 / 中高級 / 高級' },
              { id: 'toeic', title: '多益 TOEIC', desc: '職場商務與職場情境' },
              { id: 'ielts', title: '雅思 IELTS', desc: '學術留學與跨文化' },
              { id: 'toefl', title: '托福 TOEFL', desc: '北美大學學術思辨' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setExamType(item.id as ExamType)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  examType === item.id
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold">{item.title}</div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Choose Test Mode */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">2</span>
            <span>選擇練習模式 (Test Mode)</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTestMode('practice')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                testMode === 'practice'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>即時精解模式 (Practice & Instant Learn)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">推薦</span>
              </div>
              <p className="text-xs text-slate-600 font-normal mt-1.5 leading-relaxed">
                每作答一題，系統立即揭曉答案並給出詳細陷阱剖析、文法公式、關鍵單字與音訊發音，最適合深度精進。
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTestMode('mock_exam')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                testMode === 'mock_exam'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>全真模考診斷模式 (Mock Exam Mode)</span>
              </div>
              <p className="text-xs text-slate-600 font-normal mt-1.5 leading-relaxed">
                連續作答不中斷，模擬正式檢定高壓情境，全卷結束後一次性產出各級檢定預估成績與 AI 弱點診斷報告。
              </p>
            </button>
          </div>
        </div>

        {/* Step 3: Starting Benchmark Level & Length */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">3</span>
              <span>初始基準難度 (Starting Benchmark)</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setStartLevel(lvl)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                    startLevel === lvl
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              若不確定，建議選預設 B1（英檢中級/多益 600+ 水準），CAT 系統會自動快速校準。
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">4</span>
              <span>題數規模 (Test Length)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 6, label: '6 題 (極速篩檢)' },
                { count: 10, label: '10 題 (標準 CAT)' },
                { count: 15, label: '15 題 (高信度)' },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setQuestionCount(item.count)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                    questionCount === item.count
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>內建完整詞彙庫、精選英檢題庫及 Gemini 即時適應技術</span>
          </div>

          <button
            id="btn-start-cat-test"
            type="button"
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>開始自適應測驗練習</span>
          </button>
        </div>
      </div>
    </div>
  );
};
