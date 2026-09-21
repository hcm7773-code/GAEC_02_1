import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Brain,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';
import confetti from 'canvas-confetti';
import {
  CEFRLevel,
  ExamType,
  UserAnswerRecord,
  AIDiagnosticReport,
  VocabularyItem,
} from '../types';
import { convertThetaToScores, generateAlgorithmicDiagnostic } from '../utils/catEngine';

interface ScoreReportProps {
  theta: number;
  sem: number;
  records: UserAnswerRecord[];
  examType: ExamType;
  onRestartTest: () => void;
  onGoToNotebook: () => void;
  onSaveVocab: (item: VocabularyItem) => void;
  savedVocabIds: Set<string>;
}

export const ScoreReport: React.FC<ScoreReportProps> = ({
  theta,
  sem,
  records,
  examType,
  onRestartTest,
  onGoToNotebook,
  onSaveVocab,
  savedVocabIds,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<AIDiagnosticReport | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const scores = convertThetaToScores(theta);
  const correctCount = records.filter((r) => r.isCorrect).length;
  const accuracyPercent = records.length > 0 ? Math.round((correctCount / records.length) * 100) : 0;

  // Trigger celebratory confetti if accuracy is decent or level is B2+
  useEffect(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch AI diagnostic from server
  useEffect(() => {
    let isMounted = true;
    async function fetchDiagnostic() {
      setIsLoadingAI(true);
      try {
        const res = await fetch('/api/adaptive/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theta,
            examType,
            records,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.report) {
            setAiReport(data.report);
          } else if (isMounted) {
            setAiReport(generateAlgorithmicDiagnostic(theta, examType, records));
          }
        } else if (isMounted) {
          setAiReport(generateAlgorithmicDiagnostic(theta, examType, records));
        }
      } catch (err) {
        console.warn('Backend API unavailable (e.g. static hosting), using local IRT diagnostic:', err);
        if (isMounted) {
          setAiReport(generateAlgorithmicDiagnostic(theta, examType, records));
        }
      } finally {
        if (isMounted) setIsLoadingAI(false);
      }
    }

    fetchDiagnostic();
    return () => {
      isMounted = false;
    };
  }, [theta, examType, records]);

  // Format chart trajectory data
  const trajectoryData = records.map((rec, index) => ({
    name: `Q${index + 1}`,
    theta: Number(rec.thetaAfter.toFixed(2)),
    itemDifficulty: Number(rec.question.difficultyScore.toFixed(2)),
    isCorrect: rec.isCorrect,
    level: rec.levelAfter,
    skill: rec.question.skill,
  }));

  // Skill breakdown
  const skillsList = ['vocabulary', 'grammar', 'reading', 'listening'];
  const skillStats = skillsList.map((sk) => {
    const matched = records.filter((r) => r.question.skill === sk);
    const correct = matched.filter((r) => r.isCorrect).length;
    const rate = matched.length > 0 ? Math.round((correct / matched.length) * 100) : 0;
    return {
      skill: sk === 'vocabulary' ? '字彙' : sk === 'grammar' ? '文法' : sk === 'reading' ? '閱讀' : '聽力',
      accuracy: rate,
      total: matched.length,
      correct,
    };
  });

  const filteredRecords = records.filter((r) => {
    if (filterMode === 'wrong') return !r.isCorrect;
    if (filterMode === 'correct') return r.isCorrect;
    return true;
  });

  const handleShare = () => {
    const text = `我的英文自適應檢定評估結果：CEFR ${scores.cefr} 水準，預估多益約 ${scores.toeic} 分、全民英檢「${scores.gept}」、雅思約 ${scores.ielts} 級分！`;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Clipboard fallback failed:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Banner & Primary Score Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative rings */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-300" /> 自適應檢定測驗總評
              </span>
              <span className="text-xs text-slate-300">
                完成 {records.length} 題測驗 • 正確率 {accuracyPercent}%
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              診斷綜合能力評級：
              <span className="text-amber-400 ml-1 text-3xl sm:text-4xl">CEFR {scores.cefr}</span>
            </h1>

            <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
              透過 2-PL IRT 自適應測驗演算法動態調節題目難度，測得個人即時能力指標 θ ={' '}
              <span className="font-mono font-bold text-white">
                {theta >= 0 ? `+${theta.toFixed(2)}` : theta.toFixed(2)}
              </span>
              （測量標準誤差 SEM: ±{sem.toFixed(2)}）。
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={handleShare}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? '成績已複製！' : '分享成績'}</span>
            </button>

            <button
              onClick={onRestartTest}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再測一次挑戰</span>
            </button>
          </div>
        </div>

        {/* Multi-standard Score Projection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-white/15">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">🇹🇼 全民英檢 (GEPT)</span>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-1">{scores.gept}</div>
            <span className="text-[11px] text-slate-400 block mt-0.5">預估可通過級別</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">🏢 多益 (TOEIC)</span>
            <div className="text-lg sm:text-xl font-extrabold text-amber-300 mt-1">約 {scores.toeic} 分</div>
            <span className="text-[11px] text-slate-400 block mt-0.5">總分 990 標準分</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">🇬🇧 雅思 (IELTS)</span>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-1">約 {scores.ielts} 級分</div>
            <span className="text-[11px] text-slate-400 block mt-0.5">Band 1.0 - 9.0</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">🇺🇸 托福 (TOEFL iBT)</span>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-1">約 {scores.toefl} 分</div>
            <span className="text-[11px] text-slate-400 block mt-0.5">滿分 120 總分級</span>
          </div>
        </div>
      </div>

      {/* Grid: Adaptive Trajectory Graph & Skill Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory Graph (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>CAT 自適應難度即時調節軌跡</span>
              </h3>
              <p className="text-xs text-slate-500">
                展示每題答對（綠）/答錯（紅）後，難度與能力估計值 θ 的即時動態收斂曲線
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-0.5 bg-indigo-600 inline-block" /> 個人能力 θ
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 bg-slate-300 inline-block" /> 題目難度 b
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis domain={[-3, 3]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{data.name}</span>
                            <span className={data.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                              ({data.isCorrect ? '答對' : '答錯'})
                            </span>
                          </div>
                          <div>能力值估計 θ: <span className="font-mono text-indigo-300">{data.theta}</span></div>
                          <div>題目難度 b: <span className="font-mono text-slate-300">{data.itemDifficulty}</span></div>
                          <div>對應級別: <span className="font-bold text-amber-300">{data.level}</span></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="itemDifficulty"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="theta"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={props.key}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={payload.isCorrect ? '#10b981' : '#f43f5e'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Accuracy Bar (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">各項技能表現分析</h3>
            <p className="text-xs text-slate-500 mb-4">按題型劃分的正確率指標</p>

            <div className="space-y-4">
              {skillStats.map((st) => (
                <div key={st.skill} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{st.skill}</span>
                    <span className="text-slate-500">
                      {st.total > 0 ? `${st.correct}/${st.total} (${st.accuracy}%)` : '本輪未抽中'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        st.accuracy >= 75
                          ? 'bg-emerald-500'
                          : st.accuracy >= 50
                          ? 'bg-indigo-500'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${st.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6">
            <button
              onClick={onGoToNotebook}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>複習錯題與單字庫</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Comprehensive Diagnostic Report */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gemini 智能個別化診斷報告</h2>
              <p className="text-xs text-slate-500">針對作答反應時間、錯誤模式與難度承受度之深度洞察</p>
            </div>
          </div>
          {isLoadingAI && (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 深度分析運算中...</span>
            </div>
          )}
        </div>

        {aiReport ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overall Assessment */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-sm text-indigo-950 leading-relaxed">
              <span className="font-bold">總體能力評估：</span>
              {aiReport.overallAssessment}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 掌握良好的優勢項目
                </h4>
                <ul className="list-disc list-inside text-xs text-emerald-800 space-y-1">
                  {aiReport.strengthAreas.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-amber-600" /> 優先補強與陷阱防範
                </h4>
                <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                  {aiReport.weaknessAreas.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Targeted Advice */}
            {aiReport.targetedAdvice?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">分科技巧專門指引</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {aiReport.targetedAdvice.map((adv, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                      <div className="font-bold text-indigo-700">{adv.category}</div>
                      <div className="text-slate-700 leading-relaxed">{adv.advice}</div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        <span className="font-semibold">焦點：</span>{adv.recommendedFocus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4-step Learning Roadmap */}
            {aiReport.learningRoadmap?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">循序漸進備考學習路徑 (Roadmap)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {aiReport.learningRoadmap.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs">
            {isLoadingAI ? 'AI 正根據您的作答軌跡生成專屬檢定診斷...' : '已完成基礎指標計算。'}
          </div>
        )}
      </div>

      {/* Question by Question Detailed Review */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">本次測驗題目逐題覆盤 (Question Review)</h3>
            <p className="text-xs text-slate-500">點擊任意題目即可展開完整詳解、單字整理與文法公式</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({records.length})
            </button>
            <button
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'wrong' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              錯題 ({records.filter((r) => !r.isCorrect).length})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'correct' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              答對 ({records.filter((r) => r.isCorrect).length})
            </button>
          </div>
        </div>

        {/* Questions Accordion List */}
        <div className="space-y-3">
          {filteredRecords.map((rec, idx) => {
            const isExpanded = expandedQuestionId === rec.questionId;
            return (
              <div
                key={rec.questionId}
                className={`border rounded-xl transition-all overflow-hidden ${
                  rec.isCorrect ? 'border-slate-200 bg-white' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedQuestionId(isExpanded ? null : rec.questionId)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        rec.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {rec.isCorrect ? '✓' : '✕'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500 shrink-0">#{idx + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 shrink-0">
                      {rec.question.cefrLevel}
                    </span>
                    <p className="text-sm font-medium text-slate-800 truncate">{rec.question.prompt}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">{rec.timeSpentSeconds}s</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 text-xs space-y-4">
                    {rec.question.passage && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 italic">
                        {rec.question.passage}
                      </div>
                    )}

                    {/* Choices breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rec.question.options.map((opt) => {
                        const isChosen = rec.selectedOption === opt.id;
                        const isAnswer = rec.question.correctAnswer === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                              isAnswer
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : isChosen
                                ? 'bg-rose-50 border-rose-300 text-rose-950 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-mono font-bold">{opt.id}.</span>
                            <span>{opt.text}</span>
                            {isAnswer && <span className="ml-auto text-emerald-600 font-bold">正解</span>}
                            {isChosen && !isAnswer && <span className="ml-auto text-rose-600 font-bold">你的選擇</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Full Explanation */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div>
                        <span className="font-bold text-slate-800">💡 詳解：</span>
                        <span className="text-slate-700">{rec.question.explanation.summary}</span>
                      </div>
                      {rec.question.explanation.translation && (
                        <div className="text-slate-600">
                          <span className="font-bold text-slate-700">中譯：</span>
                          {rec.question.explanation.translation}
                        </div>
                      )}
                      {rec.question.explanation.trapAnalysis && (
                        <div className="text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                          <span className="font-bold">陷阱提醒：</span>
                          {rec.question.explanation.trapAnalysis}
                        </div>
                      )}
                    </div>

                    {/* Vocab bookmark button */}
                    {rec.question.explanation.vocabularyList?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rec.question.explanation.vocabularyList.map((voc) => {
                          const isSaved = savedVocabIds.has(voc.word.toLowerCase());
                          return (
                            <button
                              key={voc.word}
                              onClick={() => onSaveVocab(voc)}
                              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                                isSaved
                                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <Bookmark className="w-3 h-3 text-amber-500" />
                              <span>{voc.word} ({voc.pos}) - {voc.translation}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
