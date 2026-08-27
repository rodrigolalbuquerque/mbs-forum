"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Renderiza o texto da mensagem como Markdown (listas numeradas/marcadores,
// negrito, itálico, links) mantendo as quebras de linha do chat. Sem HTML cru,
// então é seguro (o react-markdown não injeta HTML por padrão).
export default function MessageText({ children }: { children: string }) {
  return (
    <div
      className={
        "wrap-break-word text-sm leading-relaxed text-[#111b21] " +
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
        "[&_p]:my-1 " +
        "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 " +
        "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 " +
        "[&_li]:my-0.5 [&_li]:pl-0.5 " +
        "[&_a]:font-medium [&_a]:text-wa-green-dark [&_a]:underline " +
        "[&_strong]:font-semibold " +
        "[&_blockquote]:border-l-2 [&_blockquote]:border-black/15 [&_blockquote]:pl-2 [&_blockquote]:text-wa-secondary " +
        "[&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] " +
        "[&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/5 [&_pre]:p-2 " +
        "[&_h1]:my-1 [&_h1]:text-base [&_h1]:font-semibold " +
        "[&_h2]:my-1 [&_h2]:text-[0.95rem] [&_h2]:font-semibold " +
        "[&_h3]:my-1 [&_h3]:font-semibold"
      }
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Links sempre abrem em nova aba, com segurança.
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
