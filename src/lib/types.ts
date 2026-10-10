// Question and answer codes come from the content sheet, so any number of
// questions (Q1, Q2 ... Q6) and answers (A, B ... F) are allowed.
export type QuestionCode = string
export type AnswerCode = string
export type Answers = Partial<Record<QuestionCode, AnswerCode>>

export type ResultRole = 'Classification' | 'Signal' | 'None'

export interface QuestionAnswer {
  code: AnswerCode
  text: string
  category: string
  display_order: number
}

export interface Question {
  code: QuestionCode
  name: string
  title: string
  supporting_text: string
  landing_blurb: string
  result_role: ResultRole
  display_order: number
  answers: QuestionAnswer[]
}

export interface QuestionsResponse {
  questions: Question[]
}

export interface ContentSection {
  id: string
  label: string
  owner: QuestionCode
  required: boolean
}

export interface ContentRule {
  id: string
  when: Array<{ question: QuestionCode; answer: AnswerCode }>
  section: string
  mode: 'Replace' | 'Add before' | 'Add after'
  text: string
  priority: number
}

/** Shape of src/content/content.json, written by scripts/build-content.mjs. */
export interface SurveyContent {
  generated_at: string
  includes_drafts: boolean
  settings: Record<string, string>
  questions: Question[]
  sections: ContentSection[]
  blocks: Record<string, Record<AnswerCode, string>>
  rules: ContentRule[]
}

export interface ResultSignal {
  code: QuestionCode
  label: string
  value: string
}

export interface ResultSection {
  id: string
  label: string
  text: string
}

/** A person's result, assembled from the content blocks and rules. */
export interface AssessmentResult {
  title: string
  classification: string
  signals: ResultSignal[]
  sections: ResultSection[]
}

export interface SubmitAnswer {
  question: QuestionCode
  answer: AnswerCode
}

/** Response shape of the live backend (src/lib/api.ts), currently unused. */
export interface SubmissionResult {
  success: boolean
  assessment_id: string
  combination_key: string
  reportTitle: string
  summary: string
  recommendation: string
  nextStep: string
  status: string
  version: number
  is_dummy: boolean
}
