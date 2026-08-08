import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminGetCommunities, adminDeleteCommunity } from "@/lib/admin-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { relativeTime } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/communities")({
  component: AdminCommunities,
});

function AdminCommunities() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-communities", debouncedSearch],
    queryFn: () => adminGetCommunities({ data: { search: debouncedSearch } }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteCommunity({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-communities"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Community deleted.");
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed."),
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(
      () => setDebounced(val),
      300,
    );
  };

  const communities = (rows ?? []) as Array<{
    id: string;
    name: string;
    type: string;
    governorate: string | null;
    created_at: string;
    creator: { username: string; full_name: string } | null;
    community_members: Array<{ count: number }>;
  }>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Communities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {communities.length} communities
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search communities…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Governorate</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : communities.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {(c.community_members?.[0] as { count: number } | undefined)?.count ?? 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.governorate ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      @{c.creator?.username ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeTime(c.created_at)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this community?</AlertDialogTitle>
            <AlertDialogDescription>
              All members will be removed and this cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
