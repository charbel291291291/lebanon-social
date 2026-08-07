import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/yalla/top-bar";
import { ProfileView } from "@/components/yalla/profile-view";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@/lib/profile";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => {
    const title = `@${params.username} on FaceLeb`;
    const description = `View @${params.username}'s FaceLeb profile — bio, governorate and community activity across Lebanon.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        {
          property: "og:url",
          content: `https://faceleb.vercel.app/u/${params.username}`,
        },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://faceleb.vercel.app/u/${params.username}`,
        },
      ],
    };
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

  return (
    <div className="min-h-screen">
      <TopBar />
      <main id="main-content" className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {isLoading && <div className="glass h-72 animate-pulse rounded-3xl" />}

        {!isLoading && !data && (
          <div className="glass rounded-3xl p-10 text-center">
            <h1 className="text-xl font-bold">Profile not available</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This profile doesn't exist, or it's private.
            </p>
            <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
              Back to the feed
            </Link>
          </div>
        )}

        {data && <ProfileView profile={data} isOwner={user?.id === data.id} />}
      </main>
    </div>
  );
}
