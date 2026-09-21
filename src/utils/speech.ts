/**
 * Web Speech API text-to-speech helper with US/UK accent support
 */

let synth: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis;
}

export interface SpeakOptions {
  rate?: number; // 0.8 - 1.2
  pitch?: number;
  accent?: 'en-US' | 'en-GB';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function playSpeech(text: string, options: SpeakOptions = {}): boolean {
  if (!synth) return false;

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.lang = options.accent ?? 'en-US';

  // Try to find a natural English voice
  const voices = synth.getVoices();
  const targetLang = options.accent ?? 'en-US';
  const matchedVoice = voices.find((v) => v.lang === targetLang && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))) 
    || voices.find((v) => v.lang.startsWith('en'));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  currentUtterance = utterance;
  synth.speak(utterance);
  return true;
}

export function stopSpeech() {
  if (synth) {
    synth.cancel();
    currentUtterance = null;
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
