export interface QuillquestFaq {
  q: string;
  a: string;
}

/**
 * Support-page FAQs. Shared so the rendered page and the FAQPage JSON-LD
 * (in app.routes.ts) never drift apart.
 */
export const QUILLQUEST_FAQS: QuillquestFaq[] = [
  {
    q: 'What can kids practice?',
    a: 'Two subjects in one app — Spelling and Times Tables. Kids pick a realm from the home screen; nothing is ever assigned. XP, ranks, badges, themes, and the daily streak are shared across both.',
  },
  {
    q: 'How do the times tables work?',
    a: "Kids type each answer on a number pad — no multiple-choice guessing. Miss one and QuillQuest shows the product with a skip-count (like 5, 10, 15…) so it teaches instead of just marking it wrong, and levels climb from the Trailhead to the Summit. Times Tables is silent — the recorded voices are a Spelling feature.",
  },
  {
    q: 'Do you drill the ×0 and ×1 tables?',
    a: 'No — ×0 and ×1 are taught once as a quick warm-up rule (anything ×0 is 0, and ×1 is itself), then the game focuses on the facts that actually take practice.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes — the core game plays offline, no internet needed to play. Optional extras (additional voices and the recorded "use it in a sentence" clips) download once from a content host and are then saved on the device.',
  },
  {
    q: "No sound in Spelling, or a word won't play aloud?",
    a: "Audio is the heart of Spelling (Times Tables is silent by design), so start with the device: make sure it isn't on silent — flip the side Ring/Silent switch so no orange is showing — and turn the volume up. You can always tap the speaker to hear a word again, and each level's read-aloud voice can be changed in Settings.",
  },
  {
    q: 'Does it collect any data?',
    a: 'No. Progress, name, and avatar stay on the device.',
  },
  {
    q: 'Will we lose progress after an update or on a new device?',
    a: 'App updates keep all progress. Because everything is stored on the device only (no accounts, no cloud sync), a brand-new device or deleting the app starts fresh.',
  },
  {
    q: 'Can multiple kids share one device?',
    a: 'Yes — each kid gets their own profile, progress, streak, and avatar (Settings → Players).',
  },
  {
    q: 'How do I set it up?',
    a: "Open the app, enter your child's age, and pick a realm — Spelling or Times Tables — to start playing.",
  },
  {
    q: 'How do I turn off the daily reminder?',
    a: "It's off by default. If it was turned on, switch it off under Settings → Reminders.",
  },
  { q: 'Is there a cost?', a: 'No — free, with no ads and no in-app purchases.' },
  { q: 'How do I reset progress?', a: 'Settings → Reset all progress.' },
];
