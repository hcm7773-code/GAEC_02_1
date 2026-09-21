import { CEFRLevel, ExamScoreConversion, Question, UserAnswerRecord } from '../types';

// CEFR Thresholds on Theta scale (-3.0 to +3.0)
export const THETA_THRESHOLDS: { level: CEFRLevel; minTheta: number; maxTheta: number }[] = [
  { level: 'A1', minTheta: -3.0, maxTheta: -1.7 },
  { level: 'A2', minTheta: -1.7, maxTheta: -0.7 },
  { level: 'B1', minTheta: -0.7, maxTheta: 0.3 },
  { level: 'B2', minTheta: 0.3, maxTheta: 1.3 },
  { level: 'C1', minTheta: 1.3, maxTheta: 2.1 },
  { level: 'C2', minTheta: 2.1, maxTheta: 3.0 },
];

/**
 * Converts ability parameter theta (-3.0 to 3.0) to CEFR Level
 */
export function thetaToCEFR(theta: number): CEFRLevel {
  const clampedTheta = Math.max(-3.0, Math.min(3.0, theta));
  for (const item of THETA_THRESHOLDS) {
    if (clampedTheta >= item.minTheta && clampedTheta < item.maxTheta) {
      return item.level;
    }
  }
  return clampedTheta >= 2.1 ? 'C2' : 'A1';
}

/**
 * Calculates IRT 2-PL probability of correct response
 * P(theta) = 1 / (1 + exp(-1.7 * a * (theta - b)))
 */
export function calculateProbability(theta: number, b: number, a: number = 1.2): number {
  const exponent = -1.7 * a * (theta - b);
  return 1 / (1 + Math.exp(exponent));
}

/**
 * Calculates Fisher Item Information at theta
 * I(theta) = (1.7 * a)^2 * P * (1 - P)
 */
export function calculateItemInformation(theta: number, b: number, a: number = 1.2): number {
  const p = calculateProbability(theta, b, a);
  return Math.pow(1.7 * a, 2) * p * (1 - p);
}

/**
 * Adaptive update step after user answers a question
 */
export function updateThetaAdaptive(
  currentTheta: number,
  question: Question,
  isCorrect: boolean,
  timeSpentSeconds: number,
  answeredCount: number
): { newTheta: number; newSem: number } {
  const a = question.discrimination || 1.2;
  const b = question.difficultyScore;
  const p = calculateProbability(currentTheta, b, a);
  const u = isCorrect ? 1 : 0;

  // Fisher information
  const info = calculateItemInformation(currentTheta, b, a);

  // Bayesian prior regularization weight (dampens huge oscillations early on)
  const priorWeight = Math.max(0.6, 2.5 / (answeredCount + 1));
  
  // Step size calculation based on discrepancy (u - p)
  let delta = (u - p) / (info + priorWeight);

  // Modest reaction to response speed (optional nuance):
  // If correct and fast (< 15s), high mastery; if guessed too rapidly (< 2s), discount
  if (isCorrect && timeSpentSeconds > 3 && timeSpentSeconds < 16) {
    delta *= 1.1;
  } else if (!isCorrect && timeSpentSeconds < 2) {
    // Possible random misclick or hasty guess
    delta *= 0.85;
  }

  // Restrict step size to prevent wild swings
  const maxStep = Math.max(0.35, 0.9 / Math.sqrt(answeredCount + 1));
  delta = Math.max(-maxStep, Math.min(maxStep, delta));

  const newTheta = Math.max(-3.0, Math.min(3.0, currentTheta + delta));

  // Recalculate SEM: SEM decreases with more items answered
  const baseSem = 1.0 / Math.sqrt((answeredCount + 1) * 0.45 + 0.8);
  const newSem = Math.max(0.18, Math.min(0.85, baseSem));

  return {
    newTheta: Number(newTheta.toFixed(3)),
    newSem: Number(newSem.toFixed(3)),
  };
}

/**
 * Maps theta to standard exam scores
 */
export function convertThetaToScores(theta: number) {
  const clamped = Math.max(-3.0, Math.min(3.0, theta));
  const cefr = thetaToCEFR(clamped);

  // Normalization ratio [0, 1]
  const ratio = (clamped + 3.0) / 6.0;

  // TOEIC: 10 to 990 (5-point increments)
  // Logistic mapping calibrated to standard percentiles
  let toeic = Math.round((10 + 980 / (1 + Math.exp(-1.4 * clamped))) / 5) * 5;
  toeic = Math.max(120, Math.min(990, toeic));

  // IELTS: 2.5 to 9.0 (0.5 increments)
  let ieltsRaw = 2.5 + ratio * 6.5;
  let ielts = Math.round(ieltsRaw * 2) / 2;
  ielts = Math.max(3.0, Math.min(9.0, ielts));

  // TOEFL iBT: 20 to 120
  let toefl = Math.round(20 + ratio * 100);
  toefl = Math.max(25, Math.min(120, toefl));

  // GEPT (全民英檢) mapping
  let gept = '初級 (待加強)';
  if (clamped >= 2.0) gept = '高級 (優異通過 / 接近母語)';
  else if (clamped >= 1.2) gept = '高級 (通過可期)';
  else if (clamped >= 0.3) gept = '中高級 (良好通過)';
  else if (clamped >= -0.7) gept = '中級 (穩定通過)';
  else if (clamped >= -1.7) gept = '初級 (通過)';

  return {
    cefr,
    toeic,
    ielts,
    toefl,
    gept,
    theta: clamped,
  };
}

/**
 * Standard exam comparison chart data
 */
export const EXAM_COMPARISONS: ExamScoreConversion[] = [
  {
    cefr: 'A1',
    thetaRange: 'θ < -1.7',
    gept: '初級預備級',
    toeicRange: '120 - 220',
    toeflRange: '0 - 31',
    ieltsRange: '2.0 - 3.0',
    description: '能理解並使用熟悉的日常基本用語、簡單具體的要求。',
  },
  {
    cefr: 'A2',
    thetaRange: '-1.7 ~ -0.7',
    gept: '全民英檢 初級',
    toeicRange: '225 - 545 (棕/橘)',
    toeflRange: '32 - 41',
    ieltsRange: '3.5 - 4.0',
    description: '能理解直接相關領域的句子（如個人和家庭基本資訊、購物、當地地理、就業）。',
  },
  {
    cefr: 'B1',
    thetaRange: '-0.7 ~ +0.3',
    gept: '全民英檢 中級',
    toeicRange: '550 - 780 (綠/藍)',
    toeflRange: '42 - 71',
    ieltsRange: '4.5 - 5.0',
    description: '能理解工作、學校、休閒等熟悉事物中標準清晰輸入的主要觀點。',
  },
  {
    cefr: 'B2',
    thetaRange: '+0.3 ~ +1.3',
    gept: '全民英檢 中高級',
    toeicRange: '785 - 940 (藍/金)',
    toeflRange: '72 - 94',
    ieltsRange: '5.5 - 6.5',
    description: '能理解複雜主題文本的核心思想，包括技術討論，並能自然流暢地溝通。',
  },
  {
    cefr: 'C1',
    thetaRange: '+1.3 ~ +2.1',
    gept: '全民英檢 高級',
    toeicRange: '945 - 990 (金色證書頂尖)',
    toeflRange: '95 - 114',
    ieltsRange: '7.0 - 8.0',
    description: '能理解各類要求較高、篇幅較長的文章，能靈活有效地運用語言進行社交、學術和專業交流。',
  },
  {
    cefr: 'C2',
    thetaRange: 'θ ≥ +2.1',
    gept: '全民英檢 高級頂尖 / 優級',
    toeicRange: '990 滿分級',
    toeflRange: '115 - 120',
    ieltsRange: '8.5 - 9.0',
    description: '精通掌握，能輕鬆理解幾乎所有聽到或讀到的內容，表達精準自如。',
  },
];

/**
 * Selects the next best question from the available pool based on Fisher Information & target theta
 */
export function selectOptimalNextQuestion(
  currentTheta: number,
  availableQuestions: Question[],
  usedQuestionIds: Set<string>,
  recentSkills: string[]
): Question | null {
  const candidates = availableQuestions.filter((q) => !usedQuestionIds.has(q.id));
  if (candidates.length === 0) return null;

  // Score candidate questions based on Fisher information + skill balancing penalty
  let bestQuestion = candidates[0];
  let bestScore = -Infinity;

  // Count recent skill occurrences
  const lastSkill = recentSkills[recentSkills.length - 1];

  for (const q of candidates) {
    const info = calculateItemInformation(currentTheta, q.difficultyScore, q.discrimination || 1.2);
    // Distance penalty
    const dist = Math.abs(currentTheta - q.difficultyScore);
    let score = info - dist * 0.3;

    // Diversity penalty: prefer alternating skills
    if (q.skill === lastSkill) {
      score -= 0.4;
    }

    if (score > bestScore) {
      bestScore = score;
      bestQuestion = q;
    }
  }

  return bestQuestion;
}

/**
 * Generates algorithmic diagnostic analysis when server API is unavailable
 */
export function generateAlgorithmicDiagnostic(
  theta: number,
  examType: ExamType,
  records: UserAnswerRecord[]
): AIDiagnosticReport {
  const correctCount = records.filter((r) => r.isCorrect).length;
  const total = records.length;
  const rate = total > 0 ? Math.round((correctCount / total) * 100) : 70;
  const scores = convertThetaToScores(theta);

  // Analyze weakest skill
  const skillsList: ('vocabulary' | 'grammar' | 'reading' | 'listening')[] = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
  ];
  let weakestSkill = '文法結構';
  let minAccuracy = 101;
  for (const sk of skillsList) {
    const matched = records.filter((r) => r.question.skill === sk);
    if (matched.length > 0) {
      const acc = (matched.filter((r) => r.isCorrect).length / matched.length) * 100;
      if (acc < minAccuracy) {
        minAccuracy = acc;
        weakestSkill =
          sk === 'vocabulary'
            ? '高階字彙辨析'
            : sk === 'grammar'
            ? '複合文法與句型'
            : sk === 'reading'
            ? '長篇閱讀推論'
            : '語速與情境聽力';
      }
    }
  }

  return {
    overallLevel: scores.cefr,
    overallAssessment: `根據自適應項目反應理論（IRT 2-PL）演算推估，您的即時實力指標 θ 為 ${theta.toFixed(
      2
    )}，對應歐洲語言共同架構（CEFR）的 ${scores.cefr} 水準，在本次作答中整體正確率為 ${rate}%。`,
    strengthAreas: [
      `具備在 CEFR ${scores.cefr} 難度層次下的穩定反應能力與題型掌握度`,
      '日常情境核心句構與基礎商務語意理解精準度高',
      '作答節奏明快，能有效辨識題幹關鍵訊號與高頻詞彙',
    ],
    weaknessAreas: [
      `在「${weakestSkill}」部分偶有落入干擾項陷阱之情形`,
      '遇到多重子句轉折或倒裝句型時，需注意邏輯主詞與時態的一致性',
      '學術論文或深度新聞語境下的精確近義詞辨析仍有加強空間',
    ],
    targetedAdvice: [
      {
        category: '字彙強化',
        advice: '建議採用「主題搭配詞（Collocations）」聯想記憶，而非孤立背誦單字。',
        recommendedFocus: `${scores.cefr} 檢定必考高頻動詞與介系詞組合`,
      },
      {
        category: '句型文法',
        advice: '重點練習分詞構句、否定倒裝與假設語氣非限定用法。',
        recommendedFocus: '歷屆常考易混淆文法題庫專項精解',
      },
      {
        category: '應試策略',
        advice: '正式考試中注意時間分配，利用略讀（Skimming）先行鎖定題幹關鍵字。',
        recommendedFocus: '模擬計時訓練與錯題反思複習',
      },
    ],
    estimatedScores: {
      cefr: scores.cefr,
      toeic: scores.toeic,
      gept: scores.gept,
      ielts: scores.ielts,
      toefl: scores.toefl,
    },
    learningRoadmap: [
      '第 1 階段：針對本次作答之錯題本進行深度覆盤與概念盲點釐清',
      `第 2 階段：專項衝刺「${weakestSkill}」模組，精熟核心考點`,
      `第 3 階段：進行 CEFR ${scores.cefr} 全真自適應模考，檢驗指標穩定度`,
      '第 4 階段：正式報名目標檢定，調整應考作息發揮實力',
    ],
  };
}
