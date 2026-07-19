"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import BasicsLayout from "@/components/BasicsLayout";
import Markdown, { extractHeadings } from "@/components/Markdown";
import { getBasicsArticle } from "@/lib/basicsData";

export default function BasicsArticle() {
  const params = useParams<{ slug: string }>();
  const article = getBasicsArticle(params.slug);

  if (!article) {
    notFound();
  }

  const toc = extractHeadings(article.body);

  return (
    <BasicsLayout activeSlug={article.slug} toc={toc}>
      <p className="text-sm text-gray-500 dark:text-slate-500">
        <Link href="/resources/basics" className="hover:text-gray-900 dark:hover:text-white">
          Basics
        </Link>{" "}
        / {article.title}
      </p>

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{article.title}</h1>

      <Markdown body={article.body} />
    </BasicsLayout>
  );
}
