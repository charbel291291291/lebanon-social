import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { adminGetFood, adminUpdateFood, adminDeleteFood } from "@/lib/admin-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/_authenticated/admin/food")({
  component: AdminFood,
});

function AdminFood() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-food", debouncedSearch],
    queryFn: () => adminGetFood({ data: { search: debouncedSearch } }),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; is_featured?: boolean }) =>
      adminUpdateFood({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-food"] });
      toast.success("Food place updated.");
    },
    onError: () => toast.error("Update failed."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteFood({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-food"] });
      toast.success("Food place deleted.");
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

  const places = (rows ?? []) as Array<{
    id: string;
    name: string;
    cuisine: string;
    governorate: string | null;
    price_range: string;
    rating: number;
    is_featured: boolean;
    created_at: string;
  }>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Food Places</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {places.length} places · toggle Featured to pin to the top
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search food places…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Cuisine</TableHead>
              <TableHead>Governorate</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-center">Featured</TableHead>
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
              : places.map((p) => (
                  <TableRow key={p.id} className={p.is_featured ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.cuisine}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.governorate ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{p.price_range}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="tabular-nums">{Number(p.rating).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.is_featured}
                        onCheckedChange={(v) =>
                          updateMut.mutate({ id: p.id, is_featured: v })
                        }
                        aria-label="Toggle featured"
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteId(p.id)}
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
            <AlertDialogTitle>Delete this food place?</AlertDialogTitle>
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
