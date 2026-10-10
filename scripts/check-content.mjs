#!/usr/bin/env node
/**
 * Stops a production build that would publish draft content. content.json is
 * built with --include-drafts while text is being reviewed (so it can be
 * previewed locally); it must be rebuilt with `npm run content`, which only
 * publishes Approved rows, before it can go live.
 *
 * Set ALLOW_DRAFT_CONTENT=1 to build a preview anyway.
 */
import { readFile } from 'node:fs/promises'

const content = JSON.parse(await readFile(new URL('../src/content/content.json', import.meta.url), 'utf8'))
if (content.includes_drafts && !process.env.ALLOW_DRAFT_CONTENT) {
  console.error(
    '\nsrc/content/content.json includes content that is still "In review".\n' +
      'Approve it in the content sheet and run `npm run content` before building for release,\n' +
      'or set ALLOW_DRAFT_CONTENT=1 to build a preview.\n',
  )
  process.exit(1)
}
