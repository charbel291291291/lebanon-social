import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminGetTrends, adminDeleteTrend } from "@/lib/admin-fns";
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

export const Route = createFileRoute("/_authenticated/admin/trends")({
  component: AdminTrends,
});

function AdminTrends() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-trends"],
    queryFn: () => adminGetTrends(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteTrend({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trends"] });
      toast.success("Trend removed.");
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed."),
  });

  const trends = (rows ?? []) as Array<{
    id: string;
    tag: string;
    post_count: number;
    updated_at: string;
  }>;

  const maxCount = Math.max(...trends.map((t) => t.post_count), 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {trends.length} trending tags · sorted by post count
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Activity</TableHead>
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
              : trends.map((t, i) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">#{t.tag}</TableCell>
                    <TableCell className="tabular-nums">{t.post_count.toLocaleString()}</TableCell>
                    <TableCell className="w-40">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(t.post_count / maxCount) * 100}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove trend"
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
            <AlertDialogTitle>Remove this trend?</AlertDialogTitle>
            <AlertDialogDescription>
              The trend tag will be removed from the trending list. Posts with this tag will not be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
