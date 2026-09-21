import React, { useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Trash2,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserAnswerRecord, VocabularyItem } from '../types';
import { playSpeech, isSpeechSupported } from '../utils/speech';

interface MistakeNotebookProps {
  mistakes: UserAnswerRecord[];
  savedVocab: VocabularyItem[];
  onRemoveVocab: (word: string) => void;
  onClearMistakes: () => void;
  onReplayMistake?: (record: UserAnswerRecord) => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  mistakes,
  savedVocab,
  onRemoveVocab,
  onClearMistakes,
  onReplayMistake,
}) => {
  const [activeTab, setActiveTab] = useState<'mistakes' | 'vocab'>('mistakes');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Controller */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            <span>個人學習筆記與弱點庫</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            自動彙整自適應測驗中辨識出的答錯題目與個人收藏單字，方便考前專注複習。
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'mistakes'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            錯題複習 ({mistakes.length})
          </button>
          <button
            onClick={() => setActiveTab('vocab')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'vocab'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            單字庫 ({savedVocab.length})
          </button>
        </div>
      </div>

      {/* Mistakes Tab */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          {mistakes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-slate-700">目前沒有累積錯題！</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                你在自適應測驗中的表現令人驚艷，或尚未有答錯記錄。進行測驗即可在此自動收錄錯題。
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={onClearMistakes}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空錯題記錄</span>
                </button>
              </div>

              <div className="space-y-3">
                {mistakes.map((record, index) => {
                  const isExpanded = expandedId === record.questionId;
                  const q = record.question;

                  return (
                    <div
                      key={`${record.questionId}-${index}`}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : record.questionId)}
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                              {q.cefrLevel}
                            </span>
                            <span className="text-slate-400 font-mono">
                              你的回答: ({record.selectedOption}) ✕ 正確: ({q.correctAnswer})
                            </span>
                            <span className="text-slate-500 font-medium">
                              技能: {q.skill === 'grammar' ? '文法' : q.skill === 'vocabulary' ? '單字' : '閱讀'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 leading-snug">{q.prompt}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {onReplayMistake && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onReplayMistake(record);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">重測本題</span>
                            </button>
                          )}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="p-5 bg-slate-50 border-t border-slate-200 text-xs space-y-4">
                          {q.passage && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 italic">
                              {q.passage}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl border ${
                                  opt.id === q.correctAnswer
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                    : opt.id === record.selectedOption
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="font-mono font-bold mr-1.5">{opt.id}.</span>
                                <span>{opt.text}</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                            <p className="text-slate-800 leading-relaxed font-medium">
                              💡 <span className="font-bold">詳解：</span>{q.explanation.summary}
                            </p>
                            {q.explanation.translation && (
                              <p className="text-slate-600">
                                <span className="font-bold">中譯：</span>{q.explanation.translation}
                              </p>
                            )}
                            {q.explanation.trapAnalysis && (
                              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                                <span className="font-bold">陷阱提醒：</span>{q.explanation.trapAnalysis}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Vocabulary Tab */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {savedVocab.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-slate-700">單字本目前是空的</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                在測驗過程中，點擊詳解中的單字書籤按鈕，即可將重要單字收藏至此複習。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {savedVocab.map((item) => (
                <div
                  key={item.word}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-extrabold text-slate-900">{item.word}</h4>
                        <span className="text-xs font-mono text-slate-400 font-semibold">{item.pos}</span>
                      </div>
                      {item.phonetic && (
                        <span className="text-[11px] font-mono text-slate-400 block">{item.phonetic}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isSpeechSupported() && (
                        <button
                          onClick={() => playSpeech(item.word)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                          title="發音"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveVocab(item.word)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        title="移出單字本"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {item.translation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
