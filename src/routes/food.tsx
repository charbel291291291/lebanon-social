import { createFileRoute } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";

export const Route = createFileRoute("/food")({
  head: () => ({ meta: [{ title: "Food — FaceLeb" }] }),
  component: FoodPage,
});

function FoodPage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl py-24">
          <div className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary">
            <UtensilsCrossed className="size-10" />
          </div>
          <h1 className="text-2xl font-bold">Food & Restaurants</h1>
          <p className="max-w-sm text-center text-muted-foreground">
            Explore the best Lebanese food, restaurants, and recipes. Coming soon!
          </p>
        </div>
      </main>
    </div>
  );
}
