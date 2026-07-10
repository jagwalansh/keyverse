import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("keyverse-vs-monkeytype");

export const Route = createFileRoute("/articles/keyverse-vs-monkeytype")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Comparison Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/keyverse-vs-monkeytype",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
