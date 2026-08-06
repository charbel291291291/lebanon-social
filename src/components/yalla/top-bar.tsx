import { Bell, MessageCircle, Search, Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { FaceLebIcon } from "./faceleb-icon";
import { useAuth } from "@/hooks/use-auth";

export function TopBar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 glass rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <FaceLebIcon className="size-10 shrink-0 drop-shadow-sm" />
          <span className="hidden font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight sm:block">
            <span style={{ color: "#1A4BFF" }}>Face</span><span style={{ color: "#EE0000" }}>Leb</span>
          </span>
        </Link>

        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search people, places, groups, hashtags…"
            aria-label="Search FaceLeb"
            className="h-11 rounded-full border-border/60 bg-background/60 pl-10 backdrop-blur"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Messages">
            <MessageCircle className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-gold" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label="Menu">
            <Menu className="size-5" />
          </Button>
          {user ? (
            <Link to="/settings" aria-label="Your profile">
              <Avatar className="ml-1 size-9 ring-2 ring-gold/60">
                <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                  {(user.email ?? "YO").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button asChild size="sm" className="ml-1 rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}