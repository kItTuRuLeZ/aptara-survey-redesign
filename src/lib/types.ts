// Question and answer codes come from the content sheet, so any number of
// questions (Q1, Q2 ... Q6) and answers (A, B ... F) are allowed.
export type QuestionCode = string
export type AnswerCode = string
/** One code for a Single question; a non-empty list for a Multi question. */
export type AnswerValue = AnswerCode | AnswerCode[]
export type Answers = Partial<Record<QuestionCode, AnswerValue>>

export type ResultRole = 'Classification' | 'Signal' | 'None'
export type InputType = 'Single' | 'Multi'

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
  input_type: InputType
  /** Questions sharing a step number appear together on one screen. */
  step: number
  /** Heading for a screen with more than one question. */
  step_heading: string
  display_order: number
  answers: QuestionAnswer[]
}

/** One screen of the assessment: one or more questions. */
export interface Step {
  number: number
  heading: string
  name: string
  questions: Question[]
}

export interface QuestionsResponse {
  questions: Question[]
}

export interface ContentSection {
  id: string
  label: string
  owner: QuestionCode
  required: boolean
  /** Added to the reason of an earlier priority card when this section's card is merged into it. */
  merge_note?: string
}

export interface ContentBlock {
  heading: string
  text: string
  why: string
  /** The central action of a priority card; cards sharing one are shown once. */
  action?: string
}

export interface ContentRule {
  id: string
  /** For a Multi question, a condition matches when the answer is among the selections. */
  when: Array<{ question: QuestionCode; answer: AnswerCode }>
  section: string
  mode: 'Replace' | 'Add before' | 'Add after' | 'Remove'
  heading: string
  text: string
  why: string
  priority: number
}

/** Shape of src/content/content.json, written by scripts/build-content.mjs. */
export interface SurveyContent {
  generated_at: string
  includes_drafts: boolean
  settings: Record<string, string>
  questions: Question[]
  sections: ContentSection[]
  /** blocks[section][answerCode]; a Multi question also has a MULTI block. */
  blocks: Record<string, Record<AnswerCode, ContentBlock>>
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
  heading: string
  text: string
  why: string
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
