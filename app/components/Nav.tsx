"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Новая оценка" },
    { href: "/cabinet", label: "Личный кабинет" },
  ];

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(10, 15, 44, 0.06)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-5 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-300"
                style={{
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--muted)",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
