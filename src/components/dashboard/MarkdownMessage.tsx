import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

export function MarkdownMessage({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
        "prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-a:text-primary hover:prose-a:underline",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:text-foreground",
        "prose-blockquote:border-l-primary prose-blockquote:bg-secondary/40 prose-blockquote:py-0.5 prose-blockquote:px-3 prose-blockquote:rounded-r-md prose-blockquote:not-italic prose-blockquote:text-foreground",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-code:bg-secondary/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:text-foreground",
        "prose-table:my-3 prose-table:text-foreground prose-th:bg-secondary/60 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-foreground prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-border prose-td:text-foreground prose-th:border-b prose-th:border-border",
        "prose-hr:border-border",
        "[&_pre]:!bg-transparent [&_pre]:!text-foreground [&_tbody_tr]:border-border [&_thead]:text-foreground",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className, node: _node, ...rest } = props as React.ComponentPropsWithoutRef<"code"> & { node?: unknown };
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;
            if (isInline) {
              return <code className={className} {...rest}>{children}</code>;
            }
            return (
              <div className="rounded-lg overflow-hidden border border-border my-3 text-[13px]">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-secondary/60 text-muted-foreground border-b border-border">
                  {match[1]}
                </div>
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneDark}
                  PreTag="div"
                  customStyle={{ margin: 0, background: "transparent", padding: "0.85rem 1rem" }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          },
          table(props) {
            return (
              <div className="overflow-x-auto rounded-lg border border-border my-3">
                <table className="w-full text-sm">{props.children}</table>
              </div>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
