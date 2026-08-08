import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { adminGetPosts, adminDeletePost } from "@/lib/admin-fns";
import { postTags } from "@/lib/yalla-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export const Route = createFileRoute("/_authenticated/admin/posts")({
  component: AdminPosts,
});

function AdminPosts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [tag, setTag] = useState("all");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-posts", debouncedSearch, tag, page],
    queryFn: () => adminGetPosts({ data: { search: debouncedSearch, tag, page } }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeletePost({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Post deleted.");
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

  const posts = (data?.posts ?? []) as Array<{
    id: string;
    body: string;
    tag: string;
    governorate: string | null;
    created_at: string;
    author: { username: string; full_name: string } | null;
  }>;
  const total = data?.count ?? 0;
  const perPage = 25;
  const pages = Math.ceil(total / perPage);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString()} total posts
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search post content…"
            className="pl-9"
          />
        </div>
        <Select
          value={tag}
          onValueChange={(v) => {
            setTag(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {postTags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="w-12" />
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
              : posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm">{p.body}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      @{p.author?.username ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.tag}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.governorate ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeTime(p.created_at)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete post"
                      >
                        <Trash2 className="size-4" />
                      </button>
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
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post along with all its comments, reactions, and
              polls.
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
