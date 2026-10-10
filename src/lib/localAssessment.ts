import type { Answers, AssessmentResult, QuestionsResponse } from './types'
import { content } from '../content'
import { composeResult } from './composeResult'

/**
 * Serves questions and results from src/content/content.json, which
 * scripts/build-content.mjs generates from the content sheet. Results are
 * assembled from reviewed text blocks, so every answer combination gets a
 * complete result with no live AI or backend call.
 */

export function getQuestions(): Promise<QuestionsResponse> {
  return Promise.resolve({ questions: content.questions })
}

export function submitAssessment(answers: Answers): Promise<AssessmentResult> {
  return Promise.resolve(composeResult(content, answers))
}
