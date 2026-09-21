export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExamType = 'all' | 'gept' | 'toeic' | 'toefl' | 'ielts' | 'cefr';

export type SkillCategory = 'vocabulary' | 'grammar' | 'reading' | 'listening';

export type TestMode = 'practice' | 'mock_exam'; // practice: instant explanations; mock_exam: answer all then get full diagnostic

export interface VocabularyItem {
  word: string;
  pos: string; // part of speech, e.g., 'n.', 'v.', 'adj.'
  translation: string;
  phonetic?: string;
  exampleSentence?: string;
}

export interface QuestionExplanation {
  summary: string;
  keyPoints: string[];
  trapAnalysis: string; // Explaining common misconceptions and distractors
  vocabularyList: VocabularyItem[];
  grammarRule?: string;
  translation: string;
}

export interface Question {
  id: string;
  cefrLevel: CEFRLevel;
  difficultyScore: number; // Item difficulty b parameter in IRT (-3.0 to +3.0)
  discrimination: number; // IRT a parameter (e.g. 1.0 - 2.0)
  skill: SkillCategory;
  examTags: ('gept' | 'toeic' | 'toefl' | 'ielts')[];
  prompt: string;
  passage?: string; // Optional context or reading paragraph
  audioText?: string; // Text to be read aloud via Web Speech API
  options: {
    id: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: QuestionExplanation;
  topicTags: string[];
}

export interface UserAnswerRecord {
  questionId: string;
  question: Question;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  timeSpentSeconds: number;
  thetaBefore: number;
  thetaAfter: number;
  levelBefore: CEFRLevel;
  levelAfter: CEFRLevel;
  timestamp: number;
}

export interface TestSessionState {
  sessionId: string;
  examType: ExamType;
  testMode: TestMode;
  targetQuestionCount: number;
  currentIndex: number;
  theta: number; // Current ability estimate (-3.0 to +3.0)
  sem: number; // Standard Error of Measurement
  records: UserAnswerRecord[];
  isCompleted: boolean;
  startTime: number;
  endTime?: number;
  savedVocabIds: string[]; // words bookmarked by user
}

export interface ExamScoreConversion {
  cefr: CEFRLevel;
  thetaRange: string;
  gept: string;
  toeicRange: string;
  toeflRange: string;
  ieltsRange: string;
  description: string;
}

export interface AIDiagnosticReport {
  overallAssessment: string;
  strengthAreas: string[];
  weaknessAreas: string[];
  targetedAdvice: {
    category: string;
    advice: string;
    recommendedFocus: string;
  }[];
  estimatedScores: {
    cefr: CEFRLevel;
    toeic: number;
    gept: string;
    ielts: number;
    toefl: number;
  };
  learningRoadmap: string[];
}
