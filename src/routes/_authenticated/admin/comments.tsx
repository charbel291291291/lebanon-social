import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { adminGetComments, adminDeleteComment } from "@/lib/admin-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/admin/comments")({
  component: AdminComments,
});

function AdminComments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-comments", debouncedSearch, page],
    queryFn: () => adminGetComments({ data: { search: debouncedSearch, page } }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteComment({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Comment deleted.");
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed."),
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

  const comments = (data?.comments ?? []) as Array<{
    id: string;
    body: string;
    created_at: string;
    author: { username: string; full_name: string } | null;
    post: { id: string; body: string } | null;
  }>;
  const total = data?.count ?? 0;
  const pages = Math.ceil(total / 25);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString()} total comments
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search comment text…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comment</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>On Post</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : comments.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm">{c.body}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      @{c.author?.username ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="truncate text-xs text-muted-foreground">
                        {c.post?.body ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeTime(c.created_at)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
