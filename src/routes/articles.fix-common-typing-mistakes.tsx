import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("fix-common-typing-mistakes");

export const Route = createFileRoute("/articles/fix-common-typing-mistakes")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Typing Mistakes Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/fix-common-typing-mistakes",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
