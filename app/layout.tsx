import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Vila Verde · Catálogo", template: "%s · Vila Verde" },
  description: "Gestão do catálogo de produtos naturais da Vila Verde.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="[color-scheme:light]">
      <body className="bg-background font-sans text-sm leading-normal text-foreground">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
