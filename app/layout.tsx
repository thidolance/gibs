import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EstadoProvider } from "@/lib/estado-context";
import { AuthGate } from "@/components/auth/auth-gate";
import { Header } from "@/components/layout/header";
import { NavTabs } from "@/components/layout/nav-tabs";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Caixa do Gibs FC",
  description: "Mensalistas · Avulsos · Pagamentos · Balanço",
  icons: {
    icon: "/gibs-logo.avif",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        <AuthGate>
          <EstadoProvider>
            <Header />
            <NavTabs />
            <main className="mx-auto max-w-[1280px] px-6 pt-6 pb-15 max-md:px-3.5 max-md:pt-4.5 max-md:pb-12">
              {children}
            </main>
          </EstadoProvider>
        </AuthGate>
      </body>
    </html>
  );
}
