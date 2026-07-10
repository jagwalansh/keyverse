import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("rhythm-and-muscle-memory");

export const Route = createFileRoute("/articles/rhythm-and-muscle-memory")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Muscle Memory Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/rhythm-and-muscle-memory",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
