import { setting } from '../../content'

/** The stat row under the hero, from the content sheet. */
export const HERO_STATS = [
  setting('step_count_label', '5 short steps'),
  setting('estimated_time', 'About 3 minutes'),
  'Practical next steps',
]

/** Hero text, from the content sheet's Settings tab. */
export const HERO_COPY = {
  label: setting('hero_label', 'L&D Assessment'),
  lead: setting('hero_headline_lead', 'Discover your next'),
  main: setting('hero_headline_main', 'L&D priority.'),
  subtext: setting('hero_subtext'),
  start: setting('start_button', 'Start the assessment'),
}
