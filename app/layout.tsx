import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Growth Operator",
  description:
    "Performance diagnosis and experiment planning assistant for beauty, wellness, and fashion DTC brands.",
};

// Runs before React hydrates — prevents flash of wrong theme
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('ago_theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
