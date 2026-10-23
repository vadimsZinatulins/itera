// Shared representation only. Persistence, source selection and model access stay server-side.
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AssessmentQuestion = { id: string; number: number; question: string; difficulty: Difficulty; status: 'open' | 'answered' | 'skipped'; assistance: ('hint' | 'explanation')[] };
export type AssessmentBudget = { minutes: number; started_at: string; continued: boolean };
export type Assessment = { budget?: AssessmentBudget | null; revision: number; topic: string; requested_difficulty: Difficulty | null; current_question: AssessmentQuestion | null; opened: number; answered: number; skipped: number };
