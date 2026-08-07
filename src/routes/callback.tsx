import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/callback")({
  head: () => ({
    meta: [{ title: "Signing in… — FaceLeb" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      toast.error(errorDescription ?? "Authentication failed");
      navigate({ to: "/auth", search: { next: undefined } });
      return;
    }

    // Subscribe to auth state — covers both PKCE (code) and implicit (#access_token) flows.
    // The Supabase client automatically detects hash tokens and fires SIGNED_IN.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        navigate({ to: "/settings" });
      }
    });

    if (code) {
      // PKCE flow: exchange authorization code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          subscription.unsubscribe();
          toast.error(error.message);
          navigate({ to: "/auth", search: { next: undefined } });
        }
        // onAuthStateChange fires SIGNED_IN → navigates to /settings
      });
    } else {
      // Implicit flow or existing session: check now and let onAuthStateChange handle hash tokens
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          subscription.unsubscribe();
          navigate({ to: "/settings" });
        } else if (!window.location.hash.includes("access_token")) {
          // Nothing to process
          subscription.unsubscribe();
          navigate({ to: "/auth", search: { next: undefined } });
        }
        // If hash has access_token, onAuthStateChange will fire shortly
      });
    }

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
