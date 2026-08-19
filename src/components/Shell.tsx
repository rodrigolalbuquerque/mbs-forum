"use client";

import { usePathname } from "next/navigation";

export default function Shell({
  left,
  children,
}: {
  left: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#d1d7db]">
      {/* Lista de tópicos: ocupa tudo no mobile quando na home;
          fica fixa na lateral no desktop. */}
      <aside
        className={`h-full w-full flex-col border-r border-wa-panelborder bg-white md:flex md:w-[400px] md:shrink-0 ${
          isHome ? "flex" : "hidden md:flex"
        }`}
      >
        {left}
      </aside>

      {/* Conversa: escondida no mobile quando na home. */}
      <section
        className={`h-full flex-1 ${isHome ? "hidden md:flex" : "flex"}`}
      >
        {children}
      </section>
    </div>
  );
}
