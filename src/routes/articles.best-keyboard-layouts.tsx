import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("best-keyboard-layouts");

export const Route = createFileRoute("/articles/best-keyboard-layouts")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Keyboard Layouts Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/best-keyboard-layouts",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
