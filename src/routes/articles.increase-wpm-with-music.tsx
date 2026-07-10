import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("increase-wpm-with-music");

export const Route = createFileRoute("/articles/increase-wpm-with-music")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "WPM Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/increase-wpm-with-music",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
