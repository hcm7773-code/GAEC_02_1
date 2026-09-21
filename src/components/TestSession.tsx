import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Brain,
  HelpCircle,
  Zap,
  RotateCcw,
  BookOpen,
  Headphones,
  FileText,
  Clock,
} from 'lucide-react';
import { Question, CEFRLevel, ExamType, TestMode, UserAnswerRecord, VocabularyItem } from '../types';
import { playSpeech, stopSpeech, isSpeechSupported } from '../utils/speech';

interface TestSessionProps {
  currentQuestion: Question;
  questionNumber: number;
  totalQuestions: number;
  testMode: TestMode;
  examType: ExamType;
  onAnswerSubmit: (selectedOption: 'A' | 'B' | 'C' | 'D', timeSpentSeconds: number) => void;
  onNextQuestion: () => void;
  onSaveVocab: (item: VocabularyItem) => void;
  savedVocabIds: Set<string>;
  lastRecord?: UserAnswerRecord | null;
  isLoadingAI?: boolean;
  onRequestAIQuestion?: () => void;
  onFinishEarly?: () => void;
}

export const TestSession: React.FC<TestSessionProps> = ({
  currentQuestion,
  questionNumber,
  totalQuestions,
  testMode,
  examType,
  onAnswerSubmit,
  onNextQuestion,
  onSaveVocab,
  savedVocabIds,
  lastRecord,
  isLoadingAI = false,
  onRequestAIQuestion,
  onFinishEarly,
}) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US');

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    stopSpeech();
    setIsPlayingAudio(false);
  }, [currentQuestion.id]);

  // Timer counter
  useEffect(() => {
    if (isAnswerSubmitted) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isAnswerSubmitted]);

  // Keyboard shortcut listener (A, B, C, D and Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswerSubmitted) {
        if (e.key === 'Enter') {
          onNextQuestion();
        }
        return;
      }
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        setSelectedOption(key as 'A' | 'B' | 'C' | 'D');
      } else if (e.key === 'Enter' && selectedOption) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, isAnswerSubmitted, onNextQuestion]);

  const handlePlayAudio = (textToRead: string) => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    playSpeech(textToRead, {
      accent,
      rate: 0.9,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleSubmit = () => {
    if (!selectedOption || isAnswerSubmitted) return;
    const timeSpent = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    setIsAnswerSubmitted(true);
    onAnswerSubmit(selectedOption, timeSpent);
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'grammar':
        return <FileText className="w-3.5 h-3.5" />;
      case 'vocabulary':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'reading':
        return <Brain className="w-3.5 h-3.5" />;
      case 'listening':
        return <Headphones className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  const getSkillName = (skill: string) => {
    switch (skill) {
      case 'grammar':
        return '文法與句型';
      case 'vocabulary':
        return '字彙與搭配詞';
      case 'reading':
        return '閱讀理解';
      case 'listening':
        return '聽力語音理解';
      default:
        return skill;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        {/* Card Header metadata */}
        <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold">
              第 {questionNumber} 題
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold">
              {getSkillIcon(currentQuestion.skill)}
              {getSkillName(currentQuestion.skill)}
            </span>

            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              難度：{currentQuestion.cefrLevel} (b={currentQuestion.difficultyScore > 0 ? `+${currentQuestion.difficultyScore.toFixed(1)}` : currentQuestion.difficultyScore.toFixed(1)})
            </span>

            {/* Exam Tags */}
            {currentQuestion.examTags?.map((tag) => (
              <span key={tag} className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {tag}
              </span>
            ))}
          </div>

          {/* Right tool actions */}
          <div className="flex items-center gap-3">
            {/* Pronunciation voice audio player */}
            {isSpeechSupported() && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
                <button
                  onClick={() => handlePlayAudio(currentQuestion.passage || currentQuestion.prompt)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    isPlayingAudio ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="朗讀英文題目"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-medium">{isPlayingAudio ? '播放中...' : '發音'}</span>
                </button>
                <button
                  onClick={() => setAccent(accent === 'en-US' ? 'en-GB' : 'en-US')}
                  className="px-1.5 py-1 text-[11px] font-mono text-slate-500 hover:text-slate-800"
                  title="切換美式 / 英式發音"
                >
                  {accent === 'en-US' ? '🇺🇸 美音' : '🇬🇧 英音'}
                </button>
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-1 text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{elapsedTime}s</span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Optional Reading Passage */}
          {currentQuestion.passage && (
            <div className="bg-slate-50 rounded-xl p-4 md:p-5 border border-slate-200 text-slate-800 text-base leading-relaxed tracking-wide font-serif relative">
              <div className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> 閱讀上下文 / 語境對白 Context
              </div>
              <p>{currentQuestion.passage}</p>
            </div>
          )}

          {/* Question Prompt */}
          <div className="space-y-2">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 leading-snug tracking-tight">
              {currentQuestion.prompt}
            </h2>
          </div>

          {/* 4 Choices */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const isCorrect = option.id === currentQuestion.correctAnswer;
              
              let choiceStyle = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-800 bg-white';
              
              if (isAnswerSubmitted && testMode === 'practice') {
                if (isCorrect) {
                  choiceStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                } else if (isSelected && !isCorrect) {
                  choiceStyle = 'border-rose-500 bg-rose-50/70 text-rose-950 font-semibold ring-1 ring-rose-500';
                } else {
                  choiceStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                choiceStyle = 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold ring-2 ring-indigo-600/30';
              }

              return (
                <button
                  key={option.id}
                  id={`choice-btn-${option.id}`}
                  disabled={isAnswerSubmitted}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer disabled:cursor-default ${choiceStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                      isAnswerSubmitted && testMode === 'practice'
                        ? isCorrect
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                    }`}
                  >
                    {option.id}
                  </span>
                  <span className="text-base flex-1 pt-0.5">{option.text}</span>
                  {isAnswerSubmitted && testMode === 'practice' && (
                    <span className="shrink-0 pt-0.5">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Bar (Submit or Next) */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400 hidden sm:block">
              提示：可使用鍵盤快捷鍵 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">B</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">C</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">D</kbd> 以及 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">Enter</kbd>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Optional AI Question Generation Trigger */}
              {onRequestAIQuestion && !isAnswerSubmitted && (
                <button
                  id="btn-request-ai-question"
                  onClick={onRequestAIQuestion}
                  disabled={isLoadingAI}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  title="由 Gemini 針對當前能力值即時生成客製化題目"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isLoadingAI ? 'AI 生成中...' : 'Gemini 智能出題'}</span>
                </button>
              )}

              {onFinishEarly && (
                <button
                  onClick={onFinishEarly}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  提早結算報告
                </button>
              )}

              {!isAnswerSubmitted ? (
                <button
                  id="btn-submit-answer"
                  disabled={!selectedOption}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
                >
                  確認答案
                </button>
              ) : (
                <button
                  id="btn-next-question"
                  onClick={onNextQuestion}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
                >
                  <span>{questionNumber >= totalQuestions ? '查看完整診斷報告' : '下一題 (即時調適難度)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instant Feedback & Comprehensive Analysis (Practice Mode) */}
      {isAnswerSubmitted && testMode === 'practice' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              {selectedOption === currentQuestion.correctAnswer ? (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>回答正確！自適應難度已相應提高</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>回答錯誤，正確答案為 ({currentQuestion.correctAnswer})</span>
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-slate-500">CAT 考題深度解析</span>
          </div>

          {/* Summary & Translation */}
          <div className="space-y-2">
            <p className="text-slate-800 text-sm leading-relaxed font-medium">
              💡 <span className="font-bold">核心解析：</span>{currentQuestion.explanation.summary}
            </p>
            {currentQuestion.explanation.translation && (
              <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                <span className="font-bold text-slate-700">中譯：</span>{currentQuestion.explanation.translation}
              </p>
            )}
          </div>

          {/* Key Takeaways */}
          {currentQuestion.explanation.keyPoints?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">重點歸納 Key Points</h4>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                {currentQuestion.explanation.keyPoints.map((pt, i) => (
                  <li key={i} className="leading-normal">{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Trap & Misconception Analysis */}
          {currentQuestion.explanation.trapAnalysis && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>常見陷阱與盲點剖析 (Trap Analysis)</span>
              </div>
              <p className="text-amber-800 leading-relaxed pl-5">
                {currentQuestion.explanation.trapAnalysis}
              </p>
            </div>
          )}

          {/* Grammar formula if present */}
          {currentQuestion.explanation.grammarRule && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900">
              <span className="font-bold">文法句型公式：</span> {currentQuestion.explanation.grammarRule}
            </div>
          )}

          {/* Vocabulary List & Bookmark */}
          {currentQuestion.explanation.vocabularyList?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">高頻關鍵單字 Vocabulary</h4>
                <span className="text-[11px] text-slate-400">點擊書籤圖示收藏至個人單字本</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQuestion.explanation.vocabularyList.map((vocab) => {
                  const isSaved = savedVocabIds.has(vocab.word.toLowerCase());
                  return (
                    <div
                      key={vocab.word}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{vocab.word}</span>
                          <span className="text-slate-400 text-[10px] font-mono">{vocab.pos}</span>
                          {vocab.phonetic && (
                            <span className="text-slate-400 text-[10px] font-mono">{vocab.phonetic}</span>
                          )}
                        </div>
                        <div className="text-slate-600">{vocab.translation}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isSpeechSupported() && (
                          <button
                            onClick={() => playSpeech(vocab.word, { accent })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60"
                            title="聆聽發音"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSaveVocab(vocab)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSaved
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-slate-200/60'
                          }`}
                          title={isSaved ? '已收藏' : '收藏單字'}
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
