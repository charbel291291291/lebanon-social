import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { Button } from "@/components/ui/button";
import {
  fetchCommunities,
  joinCommunity,
  leaveCommunity,
  commQueryKey,
  type DbCommunity,
} from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/communities")({
  head: () => ({
    meta: [
      { title: "Communities — FaceLeb" },
      { name: "description", content: "Discover and join Lebanese communities on FaceLeb." },
    ],
  }),
  component: CommunitiesPage,
});

function CommunityCard({ community, userId }: { community: DbCommunity; userId?: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      community.is_member
        ? leaveCommunity(community.id, userId!)
        : joinCommunity(community.id, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="glass flex flex-col gap-3 rounded-3xl p-5">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Users className="size-6" />
      </div>
      <div>
        <p className="font-semibold">{community.name}</p>
        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
          {community.type} · {community.member_count.toLocaleString()} members
        </p>
      </div>
      <Button
        size="sm"
        variant={community.is_member ? "outline" : "default"}
        onClick={() => userId && mutation.mutate()}
        disabled={!userId || mutation.isPending}
        className="rounded-full"
      >
        {community.is_member ? "Joined ✓" : "Join"}
      </Button>
    </div>
  );
}

function CommunitiesPage() {
  const { user } = useAuth();
  const { data: communities = [], isLoading } = useQuery({
    queryKey: commQueryKey(user?.id),
    queryFn: () => fetchCommunities(user?.id),
  });

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-5">
          <h1 className="text-2xl font-bold">Communities</h1>
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass animate-pulse rounded-3xl p-5 h-44" />
              ))}
            </div>
          )}
          {!isLoading && communities.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center">
              <p className="text-3xl">🏘️</p>
              <p className="mt-3 font-semibold">No communities yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run the SQL migration and be the first to create one!
              </p>
            </div>
          )}
          {communities.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {communities.map((c) => (
                <CommunityCard key={c.id} community={c} userId={user?.id} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
