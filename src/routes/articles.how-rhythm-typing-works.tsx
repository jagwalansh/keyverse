import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("how-rhythm-typing-works");

export const Route = createFileRoute("/articles/how-rhythm-typing-works")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Rhythm Typing Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/how-rhythm-typing-works",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
