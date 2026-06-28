import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("choosing-songs-for-better-practice");

export const Route = createFileRoute("/articles/choosing-songs-for-better-practice")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Song Practice Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/choosing-songs-for-better-practice",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
