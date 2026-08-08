import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, BadgeCheck, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { adminGetUsers, adminUpdateUser } from "@/lib/admin-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { relativeTime } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

type User = {
  id: string;
  username: string;
  full_name: string;
  governorate: string | null;
  is_verified: boolean;
  is_admin: boolean;
  is_private: boolean;
  created_at: string;
};

function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebounced] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, page],
    queryFn: () => adminGetUsers({ data: { search: debouncedSearch, page } }),
  });

  const updateUser = useMutation({
    mutationFn: (vars: { id: string; is_verified?: boolean; is_admin?: boolean }) =>
      adminUpdateUser({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated.");
    },
    onError: () => toast.error("Update failed."),
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(0);
    clearTimeout((handleSearch as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(
      () => setDebounced(val),
      300,
    );
  };

  const users: User[] = (data?.users ?? []) as User[];
  const total = data?.count ?? 0;
  const perPage = 25;
  const pages = Math.ceil(total / perPage);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString()} registered members
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or username…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Governorate</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-center">Verified</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Private</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {(u.full_name || u.username || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sm font-medium">
                              {u.full_name || u.username}
                            </span>
                            {u.is_verified && (
                              <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                            )}
                            {u.is_admin && (
                              <Shield className="size-3.5 shrink-0 text-red-500" />
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            @{u.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.governorate ? (
                        <Badge variant="secondary">{u.governorate}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeTime(u.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={u.is_verified}
                        onCheckedChange={(v) =>
                          updateUser.mutate({ id: u.id, is_verified: v })
                        }
                        aria-label="Toggle verified"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={u.is_admin}
                        onCheckedChange={(v) =>
                          updateUser.mutate({ id: u.id, is_admin: v })
                        }
                        aria-label="Toggle admin"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={u.is_private}
                        onCheckedChange={(v) =>
                          updateUser.mutate({ id: u.id, is_private: v })
                        }
                        aria-label="Toggle private"
                      />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
