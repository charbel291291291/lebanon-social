import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaceLebIcon } from "@/components/yalla/faceleb-icon";

const title = "Sign in to FaceLeb";
const description =
  "Join FaceLeb — Lebanon's social network for neighborhoods, universities, food, events and local businesses.";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search["next"] === "string" ? (search["next"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://faceleb.vercel.app/auth" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://faceleb.vercel.app/auth" }],
  }),
  component: AuthPage,
});

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/settings";
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: safeNext(next) });
  };

  const signUp = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }
    navigate({ to: safeNext(next) });
  };

  const google = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <FaceLebIcon className="size-14 shrink-0 drop-shadow-sm" />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold leading-none">
              <span style={{ color: "#1A4BFF" }}>Face</span>
              <span style={{ color: "#EE0000" }}>Leb</span>
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">أهلا وسهلا — welcome back</p>
          </div>
        </div>

        <Tabs defaultValue="in">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="in" className="rounded-full">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="up" className="rounded-full">
              Create account
            </TabsTrigger>
          </TabsList>

          {(["in", "up"] as const).map((mode) => (
            <TabsContent key={mode} value={mode}>
              <form onSubmit={mode === "in" ? signIn : signUp} className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`${mode}-email`}>Email</Label>
                  <Input
                    id={`${mode}-email`}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${mode}-password`}>Password</Label>
                  <Input
                    id={`${mode}-password`}
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full rounded-xl">
                  {mode === "in" ? "Sign in" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          ))}
        </Tabs>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          variant="outline"
          onClick={google}
          disabled={busy}
          className="w-full rounded-xl gap-3 font-medium"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
