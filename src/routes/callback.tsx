import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/callback")({
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
      navigate({ to: "/auth" });
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast.error(error.message);
          navigate({ to: "/auth" });
        } else {
          navigate({ to: "/settings" });
        }
      });
      return;
    }

    // No code or error — check if session already exists (e.g. implicit flow)
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate({ to: session ? "/settings" : "/auth" });
    });
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
