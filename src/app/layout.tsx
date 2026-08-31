import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { JDProvider } from "@/context/JDContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PLACEMENTOS | RATHINAM",
  description: "RATHINAM PLACEMENTOS - AI-powered placement management portal.",
  icons: {
    icon: "/rathinam-icon.png",
    shortcut: "/rathinam-icon.png",
    apple: "/rathinam-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <JDProvider>
            {children}
          </JDProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
