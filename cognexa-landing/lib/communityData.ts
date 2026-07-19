export type CommunityChannel = {
  slug: string;
  title: string;
  emoji: string;
  tagline: string;
  description: string;
};

export const COMMUNITY_CHANNELS: CommunityChannel[] = [
  {
    slug: "discord",
    title: "Discord",
    emoji: "💬",
    tagline: "A live chat space for questions, feedback, and discussion.",
    description:
      "We're setting up a Discord server so the community can chat in real time, ask quick questions, and share what they're building with Cognexa. In the meantime, GitHub Issues and Discussions are the best place to reach the team.",
  },
  {
    slug: "discussions",
    title: "Discussions",
    emoji: "🗣️",
    tagline: "Longer-form Q&A and ideas, outside of bug reports.",
    description:
      "A dedicated space for open-ended questions, ideas, and show-and-tell that don't quite fit as a GitHub issue is on the way. For now, open an issue on GitHub for anything you'd like to discuss.",
  },
  {
    slug: "feature-requests",
    title: "Feature Requests",
    emoji: "💡",
    tagline: "Propose and vote on what Cognexa should build next.",
    description:
      "A structured place to submit and upvote feature ideas is coming soon. Until then, open a feature request directly as a GitHub issue and tag it accordingly.",
  },
  {
    slug: "youtube",
    title: "YouTube",
    emoji: "📺",
    tagline: "Walkthroughs, demos, and deep dives on Cognexa.",
    description:
      "We're planning a channel with product walkthroughs and deep dives into how Cognexa's retrieval pipeline works. Subscribe to updates through GitHub Releases in the meantime.",
  },
];

export function getCommunityChannel(slug: string) {
  return COMMUNITY_CHANNELS.find((c) => c.slug === slug);
}
