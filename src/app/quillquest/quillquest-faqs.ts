export interface QuillquestFaq {
  q: string;
  a: string;
}

/**
 * Support-page FAQs. Shared so the rendered page and the FAQPage JSON-LD
 * (in app.routes.ts) never drift apart.
 */
export const QUILLQUEST_FAQS: QuillquestFaq[] = [
  { q: 'Does it work offline?', a: 'Yes — fully offline, no internet needed to play.' },
  {
    q: "No sound, or a word won't play aloud?",
    a: "Audio is the heart of the game, so start with the device: flip the silent/ring switch off and turn the volume up. You can always tap the speaker to hear a word again, and each level's read-aloud voice can be changed in Settings.",
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
    a: "Open the app, enter your child's age, and they're playing.",
  },
  {
    q: 'How do I turn off the daily reminder?',
    a: "It's off by default. If it was turned on, switch it off under Settings → Reminders.",
  },
  { q: 'Is there a cost?', a: 'No — free, with no ads and no in-app purchases.' },
  { q: 'How do I reset progress?', a: 'Settings → Reset all progress.' },
];
