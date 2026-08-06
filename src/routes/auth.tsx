import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const title = "Sign in to FaceLeb";
const description =
  "Join FaceLeb — Lebanon's social network for neighborhoods, universities, food, events and local businesses.";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search['next'] === "string" ? (search['next'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: safeNext(next) });
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground shadow-lift">
            F
          </span>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold">
              Face<span className="text-gradient-cedar">Leb</span>
            </h1>
            <p className="text-xs text-muted-foreground">أهلا وسهلا — welcome back</p>
          </div>
        </div>

        <Tabs defaultValue="in">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="in" className="rounded-full">Sign in</TabsTrigger>
            <TabsTrigger value="up" className="rounded-full">Create account</TabsTrigger>
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
        <Button variant="outline" onClick={google} className="w-full rounded-xl">
          Continue with Google
        </Button>
      </div>
    </div>
  );
}