export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractHeadings(markdown: string) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => /^##\s+/.test(line.trim()))
    .map((line) => {
      const text = line.trim().replace(/^##\s+/, "");
      return { id: slugify(text), label: text };
    });
}

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="rounded bg-gray-100 px-1 py-0.5 text-[0.85em] dark:bg-white/10"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={`${keyPrefix}-${i}`}
          href={linkMatch[2]}
          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export default function Markdown({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="mt-2 list-disc space-y-1 pl-5">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    const key = `b-${idx}`;

    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    flushList(`list-${key}`);

    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 2;
      const text = line.replace(/^#{1,6}\s+/, "");
      const id = level === 2 ? slugify(text) : undefined;
      const className =
        level === 1
          ? "mt-4 text-xl font-semibold text-gray-900 dark:text-white"
          : "mt-8 scroll-mt-24 text-base font-semibold text-gray-900 dark:text-white";
      blocks.push(
        <p key={key} id={id} className={className}>
          {renderInline(text, key)}
        </p>
      );
      return;
    }

    if (line.trim() === "") return;

    blocks.push(
      <p key={key} className="mt-2 text-gray-600 dark:text-slate-400">
        {renderInline(line, key)}
      </p>
    );
  });

  flushList("list-end");

  return <div className="mt-2 text-sm leading-relaxed">{blocks}</div>;
}
