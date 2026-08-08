import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { adminGetListings, adminUpdateListing, adminDeleteListing } from "@/lib/admin-fns";
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

export const Route = createFileRoute("/_authenticated/admin/marketplace")({
  component: AdminMarketplace,
});

function AdminMarketplace() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", debouncedSearch, statusFilter, page],
    queryFn: () =>
      adminGetListings({ data: { search: debouncedSearch, status: statusFilter, page } }),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; status: string }) => adminUpdateListing({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Listing updated.");
    },
    onError: () => toast.error("Update failed."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteListing({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Listing deleted.");
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

  const listings = (data?.listings ?? []) as Array<{
    id: string;
    title: string;
    price: number | null;
    currency: string;
    category: string;
    condition: string;
    status: string;
    governorate: string | null;
    created_at: string;
    seller: { username: string; full_name: string } | null;
  }>;
  const total = data?.count ?? 0;
  const pages = Math.ceil(total / 25);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString()} listings
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search listings…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Listed</TableHead>
              <TableHead className="w-20" />
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
              : listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="max-w-[180px]">
                      <p className="truncate text-sm font-medium">{l.title}</p>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {l.price != null
                        ? `${l.currency} ${Number(l.price).toLocaleString()}`
                        : "Free"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{l.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          updateMut.mutate({
                            id: l.id,
                            status: l.status === "active" ? "hidden" : "active",
                          })
                        }
                        className="flex items-center gap-1"
                      >
                        <Badge
                          variant={l.status === "active" ? "default" : "secondary"}
                          className="cursor-pointer"
                        >
                          {l.status}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      @{l.seller?.username ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeTime(l.created_at)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteId(l.id)}
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
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
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
