import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-10">
        {children}
      </main>
      <Footer />
    </>
  );
}
