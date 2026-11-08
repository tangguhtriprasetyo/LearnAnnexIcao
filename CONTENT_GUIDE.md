# Content guide

Content quality is the whole product. A wrong limitation is worse than a missing one.

## Adding a question

Add an object to a file in `src/content/questions/` (or create a new file and register it in `src/content/index.ts`):

```json
{
  "id": "sys-elec-apu-gen-air",          // unique, kebab-case, prefix with topic area
  "topic": "sys-elec",                    // must exist in src/content/topics.ts
  "stem": "Your own wording of the question?",
  "options": ["Correct", "Plausible wrong 1", "Plausible wrong 2", "Plausible wrong 3"],
  "answer": 0,                            // index into options (options are shuffled at runtime)
  "explanation": "WHY it is right and why the distractors are wrong. Teach, do not just restate.",
  "source": { "doc": "FCOM Vol 2", "ref": "6 Electrical - APU Generator", "revision": "Rev 52" },
  "difficulty": 2,                        // 1 recall, 2 understanding, 3 system interaction
  "status": "draft"
}
```

`npm test` rejects: duplicate ids, unknown topics, out-of-range answers, duplicate options, and `verified` items missing evidence.

## Verifying an item

1. Open the item in **Library** (filter Status → Unverified).
2. Compare with the cited section of **your current** controlled document.
3. Fix the wording, numbers and reference if needed.
4. Set:
   ```json
   "status": "verified",
   "verifiedBy": "your initials",
   "verifiedAt": "2026-11-08",
   "source": { "doc": "...", "ref": "...", "revision": "Rev 52, 15 Jun 2026" }
   ```
5. When a new FCOM/QRH revision arrives, search the Library for that document and re-verify items whose chapter changed.

## Writing good distractors

- Use real neighbouring values (the 15 kt tailwind trap, 9.1 psi vs 0.125 psi), not absurd ones.
- Swap system attributions (A vs B, ELEC 1 vs ELEC 2): this is where candidates actually slip.
- Avoid "all of the above". If you must use it, set `"fixedOrder": true`.

## Using AI to draft questions

AI drafting from **your own licensed PDFs** speeds up writing questions with exact citations. Every AI draft stays
`"status": "draft"` until a qualified pilot verifies it. Never commit extracted manual text.
