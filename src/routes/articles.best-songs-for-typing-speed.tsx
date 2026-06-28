import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("best-songs-for-typing-speed");

export const Route = createFileRoute("/articles/best-songs-for-typing-speed")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Typing Speed Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/best-songs-for-typing-speed",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
