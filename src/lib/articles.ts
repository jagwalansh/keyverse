export type Article = {
  slug: string;
  path: `/articles/${string}`;
  title: string;
  description: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export const articles: Article[] = [
  {
    slug: "best-songs-for-typing-speed",
    path: "/articles/best-songs-for-typing-speed",
    title: "Best Songs to Improve Your Typing Speed",
    description:
      "Learn how to choose songs that build typing speed, accuracy, rhythm, and repeatable practice habits in KeyVerse.",
    intro:
      "The best practice song is not always the fastest one. A useful track gives you a steady pulse, clear vocals, and enough repeated structure to learn from each attempt.",
    sections: [
      {
        heading: "Start with clean vocal timing",
        body: "Songs with clear phrasing help you connect what you hear to what you type. If every line arrives at a predictable moment, you can focus on accuracy, posture, and rhythm instead of guessing where the words begin.",
      },
      {
        heading: "Move from steady to dense",
        body: "Begin with mid-tempo pop or R&B tracks, then move into faster songs once your accuracy stays consistent. Dense verses are great training, but they are more useful after you already trust your hands on simpler patterns.",
      },
      {
        heading: "Replay one difficult section",
        body: "Typing speed improves when you notice the same mistake more than once. If a chorus or verse keeps breaking your run, repeat that song until the transition feels familiar.",
      },
    ],
  },
  {
    slug: "how-rhythm-typing-works",
    path: "/articles/how-rhythm-typing-works",
    title: "How Rhythm Typing Works",
    description:
      "A practical explanation of rhythm typing, lyric timing, reading ahead, and why accuracy matters during music-based typing games.",
    intro:
      "Rhythm typing combines ordinary keyboard practice with the timing pressure of music. You are not only copying text; you are matching a lyric line while the track keeps moving.",
    sections: [
      {
        heading: "Timing changes the challenge",
        body: "A normal typing test lets you recover whenever you want. In a rhythm typing round, the song keeps advancing, so a small mistake can affect the next line. This makes calm recovery as important as raw speed.",
      },
      {
        heading: "Reading ahead matters",
        body: "Good players glance at the next line before the active line is finished. That habit creates a small buffer, which is especially helpful when a song has short phrases or quick vocal entrances.",
      },
      {
        heading: "Accuracy carries the run",
        body: "Fast typing only helps when the words stay clean. A slightly slower pass with fewer corrections usually feels better, scores better, and teaches better muscle memory.",
      },
    ],
  },
  {
    slug: "choosing-songs-for-better-practice",
    path: "/articles/choosing-songs-for-better-practice",
    title: "Choosing Songs for Better Practice",
    description:
      "Use song tempo, vocal clarity, lyric density, and sync quality to pick better KeyVerse practice tracks.",
    intro:
      "Different songs train different skills. Some help with relaxed accuracy, some build reaction speed, and some test whether you can stay composed during a busy verse.",
    sections: [
      {
        heading: "Use slow songs for control",
        body: "Slower tracks are useful when you want to improve clean typing. They give you enough time to finish each word, notice punctuation, and build confidence before the next line arrives.",
      },
      {
        heading: "Use fast songs for recovery",
        body: "Fast songs teach recovery because mistakes are harder to hide. The goal is not to be perfect immediately; it is to keep moving without letting one missed word ruin the full round.",
      },
      {
        heading: "Check sync before chasing a score",
        body: "If the lyric timing does not match the video, your score will not reflect your real typing ability. Try a different result or send a sync report when a version mismatch gets in the way.",
      },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}
