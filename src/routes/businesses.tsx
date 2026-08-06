import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";

export const Route = createFileRoute("/businesses")({
  head: () => ({ meta: [{ title: "Businesses — FaceLeb" }] }),
  component: BusinessesPage,
});

function BusinessesPage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl py-24">
          <div className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary">
            <Building2 className="size-10" />
          </div>
          <h1 className="text-2xl font-bold">Local Businesses</h1>
          <p className="max-w-sm text-center text-muted-foreground">
            Discover and support Lebanese businesses near you. Coming soon!
          </p>
        </div>
      </main>
    </div>
  );
}
