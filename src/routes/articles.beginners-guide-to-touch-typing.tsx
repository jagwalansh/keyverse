import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("beginners-guide-to-touch-typing");

export const Route = createFileRoute("/articles/beginners-guide-to-touch-typing")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Touch Typing Guide"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/beginners-guide-to-touch-typing",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
