"use client";

import Link from "next/link";

export default function Footer() {
  const links = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/map", label: "Map", icon: "🗺️" },
    { href: "/heatmap", label: "HeatMap", icon: "🔥" },
    { href: "/statistics", label: "Statistics", icon: "📊" },
    { href: "/search", label: "Search", icon: "🔍" },
    { href: "/about", label: "About Me", icon: "👤" },
  ];

  return (
    <footer className="mt-auto shrink-0 w-full border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏘️</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Ireland Property Data
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
