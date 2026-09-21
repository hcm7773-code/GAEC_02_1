import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CEFRLevel,
  ExamType,
  Question,
  TestMode,
  TestSessionState,
  UserAnswerRecord,
  VocabularyItem,
} from './types';
import { INITIAL_QUESTION_BANK } from './data/questionBank';
import {
  thetaToCEFR,
  updateThetaAdaptive,
  selectOptimalNextQuestion,
  convertThetaToScores,
} from './utils/catEngine';
import { Navbar } from './components/Navbar';
import { AdaptiveGauge } from './components/AdaptiveGauge';
import { TestSetupCard } from './components/TestSetupCard';
import { TestSession } from './components/TestSession';
import { ScoreReport } from './components/ScoreReport';
import { ExamComparisonTable } from './components/ExamComparisonTable';
import { MistakeNotebook } from './components/MistakeNotebook';

export default function App() {
  // Navigation & view states
  const [currentTab, setCurrentTab] = useState<'test' | 'report' | 'comparison' | 'notebook'>('test');
  const [selectedExam, setSelectedExam] = useState<ExamType>('all');

  // Question bank (seeded with initial high-quality questions, augmented with AI dynamically)
  const [questionsPool, setQuestionsPool] = useState<Question[]>(INITIAL_QUESTION_BANK);

  // Active test session state
  const [session, setSession] = useState<TestSessionState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());

  // Real-time dynamic CAT feedback states
  const [currentTheta, setCurrentTheta] = useState<number>(0.0);
  const [currentSem, setCurrentSem] = useState<number>(0.85);
  const [streak, setStreak] = useState<number>(0);
  const [lastDelta, setLastDelta] = useState<{
    delta: number;
    isCorrect: boolean;
    levelBefore: CEFRLevel;
    levelAfter: CEFRLevel;
  } | null>(null);

  // AI loading state
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);

  // Local storage persistence: Saved Vocabulary
  const [savedVocab, setSavedVocab] = useState<VocabularyItem[]>(() => {
    try {
      const stored = localStorage.getItem('adaptive_english_saved_vocab');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Local storage persistence: Mistakes History
  const [mistakesHistory, setMistakesHistory] = useState<UserAnswerRecord[]>(() => {
    try {
      const stored = localStorage.getItem('adaptive_english_mistakes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Last test summary
  const [lastTestSummary, setLastTestSummary] = useState<{
    level: CEFRLevel;
    toeic: number;
    gept: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('adaptive_english_last_summary');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('adaptive_english_saved_vocab', JSON.stringify(savedVocab));
    } catch (e) {}
  }, [savedVocab]);

  useEffect(() => {
    try {
      localStorage.setItem('adaptive_english_mistakes', JSON.stringify(mistakesHistory));
    } catch (e) {}
  }, [mistakesHistory]);

  const savedVocabIds = useMemo(() => {
    return new Set(savedVocab.map((v) => v.word.toLowerCase()));
  }, [savedVocab]);

  const currentLevel = useMemo(() => thetaToCEFR(currentTheta), [currentTheta]);

  // Start a new adaptive testing session
  const handleStartTest = useCallback(
    (config: {
      examType: ExamType;
      testMode: TestMode;
      startLevel: CEFRLevel;
      questionCount: number;
      useAIAdaptive: boolean;
    }) => {
      setSelectedExam(config.examType);

      // Starting theta based on benchmark
      let initialTheta = -0.2; // default B1
      switch (config.startLevel) {
        case 'A1':
          initialTheta = -2.2;
          break;
        case 'A2':
          initialTheta = -1.2;
          break;
        case 'B1':
          initialTheta = -0.2;
          break;
        case 'B2':
          initialTheta = 0.7;
          break;
        case 'C1':
          initialTheta = 1.6;
          break;
        case 'C2':
          initialTheta = 2.4;
          break;
      }

      setCurrentTheta(initialTheta);
      setCurrentSem(0.85);
      setStreak(0);
      setLastDelta(null);

      const newUsedIds = new Set<string>();

      // Filter candidates matching exam tags (or all)
      const candidates = questionsPool.filter((q) => {
        if (config.examType === 'all') return true;
        return q.examTags.includes(config.examType as any);
      });

      const poolToUse = candidates.length >= 3 ? candidates : questionsPool;
      const firstQ = selectOptimalNextQuestion(initialTheta, poolToUse, newUsedIds, []);

      if (firstQ) {
        newUsedIds.add(firstQ.id);
        setCurrentQuestion(firstQ);
      }

      setUsedQuestionIds(newUsedIds);

      setSession({
        sessionId: `session-${Date.now()}`,
        examType: config.examType,
        testMode: config.testMode,
        targetQuestionCount: config.questionCount,
        currentIndex: 0,
        theta: initialTheta,
        sem: 0.85,
        records: [],
        isCompleted: false,
        startTime: Date.now(),
        savedVocabIds: [],
      });

      setCurrentTab('test');
    },
    [questionsPool]
  );

  // Handle User Answer Submission
  const handleAnswerSubmit = useCallback(
    (selectedOption: 'A' | 'B' | 'C' | 'D', timeSpentSeconds: number) => {
      if (!session || !currentQuestion) return;

      const isCorrect = selectedOption === currentQuestion.correctAnswer;
      const levelBefore = thetaToCEFR(currentTheta);

      // Run adaptive update calculation
      const { newTheta, newSem } = updateThetaAdaptive(
        currentTheta,
        currentQuestion,
        isCorrect,
        timeSpentSeconds,
        session.records.length
      );

      const delta = Number((newTheta - currentTheta).toFixed(2));
      const levelAfter = thetaToCEFR(newTheta);

      // Update streak
      setStreak((prev) => (isCorrect ? prev + 1 : 0));

      // Record adjustment delta
      setLastDelta({
        delta,
        isCorrect,
        levelBefore,
        levelAfter,
      });

      setCurrentTheta(newTheta);
      setCurrentSem(newSem);

      const record: UserAnswerRecord = {
        questionId: currentQuestion.id,
        question: currentQuestion,
        selectedOption,
        isCorrect,
        timeSpentSeconds,
        thetaBefore: currentTheta,
        thetaAfter: newTheta,
        levelBefore,
        levelAfter,
        timestamp: Date.now(),
      };

      const updatedRecords = [...session.records, record];

      // If wrong, archive to mistakes history if not already present
      if (!isCorrect) {
        setMistakesHistory((prev) => {
          const exists = prev.some((m) => m.questionId === currentQuestion.id);
          return exists ? prev : [record, ...prev];
        });
      }

      const isCompleted = updatedRecords.length >= session.targetQuestionCount;

      setSession({
        ...session,
        theta: newTheta,
        sem: newSem,
        records: updatedRecords,
        isCompleted,
        endTime: isCompleted ? Date.now() : undefined,
      });

      // If mock exam mode, automatically transition to next or finish
      if (session.testMode === 'mock_exam') {
        if (isCompleted) {
          const scores = convertThetaToScores(newTheta);
          const summary = { level: scores.cefr, toeic: scores.toeic, gept: scores.gept };
          setLastTestSummary(summary);
          try {
            localStorage.setItem('adaptive_english_last_summary', JSON.stringify(summary));
          } catch (e) {}
          setSession((prev) => (prev ? { ...prev, isCompleted: true, endTime: Date.now() } : null));
          setCurrentQuestion(null);
          setCurrentTab('report');
        } else {
          // Immediately select next question
          advanceToNextQuestion(newTheta, updatedRecords);
        }
      }
    },
    [session, currentQuestion, currentTheta]
  );

  // Advance to next question in adaptive sequence
  const advanceToNextQuestion = useCallback(
    (targetTheta: number, recordsSoFar: UserAnswerRecord[]) => {
      if (!session) return;

      if (recordsSoFar.length >= session.targetQuestionCount) {
        // Complete the test
        const scores = convertThetaToScores(targetTheta);
        const summary = { level: scores.cefr, toeic: scores.toeic, gept: scores.gept };
        setLastTestSummary(summary);
        try {
          localStorage.setItem('adaptive_english_last_summary', JSON.stringify(summary));
        } catch (e) {}
        setSession((prev) => (prev ? { ...prev, isCompleted: true, endTime: Date.now() } : null));
        setCurrentQuestion(null);
        setCurrentTab('report');
        return;
      }

      const recentSkills = recordsSoFar.map((r) => r.question.skill);

      // Find candidates
      const candidates = questionsPool.filter((q) => {
        if (session.examType === 'all') return true;
        return q.examTags.includes(session.examType as any);
      });

      const poolToUse = candidates.length >= 2 ? candidates : questionsPool;
      let nextQ = selectOptimalNextQuestion(targetTheta, poolToUse, usedQuestionIds, recentSkills);

      // If exhausted, recycle unvisited from whole pool
      if (!nextQ) {
        nextQ = selectOptimalNextQuestion(targetTheta, questionsPool, usedQuestionIds, recentSkills);
      }

      if (nextQ) {
        setUsedQuestionIds((prev) => new Set([...prev, nextQ!.id]));
        setCurrentQuestion(nextQ);
      } else {
        // Pool exhausted: finish session cleanly
        const scores = convertThetaToScores(targetTheta);
        const summary = { level: scores.cefr, toeic: scores.toeic, gept: scores.gept };
        setLastTestSummary(summary);
        try {
          localStorage.setItem('adaptive_english_last_summary', JSON.stringify(summary));
        } catch (e) {}
        setSession((prev) => (prev ? { ...prev, isCompleted: true, endTime: Date.now() } : null));
        setCurrentQuestion(null);
        setCurrentTab('report');
      }
    },
    [session, questionsPool, usedQuestionIds]
  );

  const handleNextQuestion = () => {
    if (!session) return;
    if (session.records.length >= session.targetQuestionCount) {
      const scores = convertThetaToScores(currentTheta);
      const summary = { level: scores.cefr, toeic: scores.toeic, gept: scores.gept };
      setLastTestSummary(summary);
      try {
        localStorage.setItem('adaptive_english_last_summary', JSON.stringify(summary));
      } catch (e) {}
      setSession((prev) => (prev ? { ...prev, isCompleted: true, endTime: Date.now() } : null));
      setCurrentQuestion(null);
      setCurrentTab('report');
      return;
    }
    advanceToNextQuestion(currentTheta, session.records);
  };

  // On-demand AI Question Generation via Gemini
  const handleRequestAIQuestion = async () => {
    setIsLoadingAI(true);
    try {
      const recentSkills = session?.records.map((r) => r.question.skill) || [];
      const skillsOrder: ('vocabulary' | 'grammar' | 'reading' | 'listening')[] = [
        'vocabulary',
        'grammar',
        'reading',
        'listening',
      ];
      const nextSkill = skillsOrder.find((s) => !recentSkills.slice(-2).includes(s)) || 'vocabulary';

      const res = await fetch('/api/adaptive/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTheta,
          targetCEFR: currentLevel,
          examType: selectedExam,
          skill: nextSkill,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          const newQ: Question = data.question;
          setQuestionsPool((prev) => [newQ, ...prev]);
          setUsedQuestionIds((prev) => new Set([...prev, newQ.id]));
          setCurrentQuestion(newQ);
        }
      }
    } catch (err) {
      console.error('Error generating AI question:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Save / Bookmark Vocabulary
  const handleSaveVocab = (item: VocabularyItem) => {
    setSavedVocab((prev) => {
      const exists = prev.some((v) => v.word.toLowerCase() === item.word.toLowerCase());
      if (exists) {
        return prev.filter((v) => v.word.toLowerCase() !== item.word.toLowerCase());
      }
      return [item, ...prev];
    });
  };

  const handleRemoveVocab = (word: string) => {
    setSavedVocab((prev) => prev.filter((v) => v.word.toLowerCase() !== word.toLowerCase()));
  };

  const handleClearMistakes = () => {
    setMistakesHistory([]);
  };

  const handleReplayMistake = (record: UserAnswerRecord) => {
    setCurrentQuestion(record.question);
    setCurrentTab('test');
  };

  const handleFinishEarly = () => {
    if (!session || session.records.length === 0) {
      setSession(null);
      setCurrentQuestion(null);
      return;
    }
    const scores = convertThetaToScores(currentTheta);
    const summary = { level: scores.cefr, toeic: scores.toeic, gept: scores.gept };
    setLastTestSummary(summary);
    try {
      localStorage.setItem('adaptive_english_last_summary', JSON.stringify(summary));
    } catch (e) {}
    setSession((prev) => (prev ? { ...prev, isCompleted: true, endTime: Date.now() } : null));
    setCurrentQuestion(null);
    setCurrentTab('report');
  };

  const handleResetTest = () => {
    setSession(null);
    setCurrentQuestion(null);
    setCurrentTab('test');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedExam={selectedExam}
        onExamChange={setSelectedExam}
        currentTheta={currentTheta}
        currentLevel={currentLevel}
        savedVocabCount={savedVocab.length}
        isTestActive={!!session && !session.isCompleted}
        onResetTest={handleResetTest}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        {/* Test Tab View */}
        {currentTab === 'test' && (
          <div className="space-y-6">
            {session && currentQuestion ? (
              <>
                {/* Real-time CAT Adaptive Ability Gauge */}
                <AdaptiveGauge
                  theta={currentTheta}
                  currentLevel={currentLevel}
                  sem={currentSem}
                  lastDelta={lastDelta}
                  streak={streak}
                  questionNumber={session.records.length + 1}
                  totalQuestions={session.targetQuestionCount}
                />

                {/* Interactive Test Question Screen */}
                <TestSession
                  currentQuestion={currentQuestion}
                  questionNumber={session.records.length + 1}
                  totalQuestions={session.targetQuestionCount}
                  testMode={session.testMode}
                  examType={session.examType}
                  onAnswerSubmit={handleAnswerSubmit}
                  onNextQuestion={handleNextQuestion}
                  onSaveVocab={handleSaveVocab}
                  savedVocabIds={savedVocabIds}
                  lastRecord={session.records[session.records.length - 1]}
                  isLoadingAI={isLoadingAI}
                  onRequestAIQuestion={handleRequestAIQuestion}
                  onFinishEarly={handleFinishEarly}
                />
              </>
            ) : (
              /* Setup & Start Card */
              <TestSetupCard
                onStartTest={handleStartTest}
                defaultExamType={selectedExam}
                lastTestSummary={lastTestSummary}
              />
            )}
          </div>
        )}

        {/* Diagnostic Report View */}
        {currentTab === 'report' && (
          <ScoreReport
            theta={currentTheta}
            sem={currentSem}
            records={session?.records || mistakesHistory.slice(0, 10)}
            examType={selectedExam}
            onRestartTest={handleResetTest}
            onGoToNotebook={() => setCurrentTab('notebook')}
            onSaveVocab={handleSaveVocab}
            savedVocabIds={savedVocabIds}
          />
        )}

        {/* Standard Exam Matrix Comparison View */}
        {currentTab === 'comparison' && (
          <ExamComparisonTable
            currentLevel={currentLevel}
            onSelectLevelBenchmark={(lvl) => {
              handleStartTest({
                examType: selectedExam,
                testMode: 'practice',
                startLevel: lvl,
                questionCount: 10,
                useAIAdaptive: true,
              });
            }}
          />
        )}

        {/* Mistakes & Vocabulary Notebook View */}
        {currentTab === 'notebook' && (
          <MistakeNotebook
            mistakes={mistakesHistory}
            savedVocab={savedVocab}
            onRemoveVocab={handleRemoveVocab}
            onClearMistakes={handleClearMistakes}
            onReplayMistake={handleReplayMistake}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>
            各級英文檢定自適應測驗練習平台 • 支援全民英檢 (GEPT)、多益 (TOEIC)、托福 (TOEFL)、雅思 (IELTS) 與 CEFR 國際架構
          </p>
          <p className="font-mono text-slate-400">
            CAT Engine: 2-PL IRT Adaptive Algorithm & Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
