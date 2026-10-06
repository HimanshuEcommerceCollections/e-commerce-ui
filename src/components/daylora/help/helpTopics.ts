/** Help center topics (design 10), in side-nav order. Shared by the server page (metadata) and the client view. */
export const HELP_TOPICS = [
  ["home", "Help home"],
  ["shipping", "Shipping"],
  ["returns", "Returns & refunds"],
  ["faq", "FAQs"],
  ["contact", "Contact us"],
  ["privacy", "Privacy policy"],
  ["terms", "Terms of use"],
] as const;

export type HelpTopic = (typeof HELP_TOPICS)[number][0];

export const isHelpTopic = (t: string | null | undefined): t is HelpTopic => HELP_TOPICS.some(([k]) => k === t);
export const helpTopicTitle = (t: HelpTopic): string => (t === "home" ? "Help" : HELP_TOPICS.find(([k]) => k === t)![1]);
