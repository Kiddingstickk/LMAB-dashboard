import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Shared list + mutation state for any content type.
export function useCrud<T extends { id: string }, I>(opts: {
  key: string;
  label: string;
  list: () => Promise<T[]>;
  create: (i: I) => Promise<T>;
  update: (id: string, p: Partial<I>) => Promise<T>;
  remove: (id: string) => Promise<void>;
}) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: [opts.key], queryFn: opts.list });
  const done = () => qc.invalidateQueries({ queryKey: [opts.key] });
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

  const create = useMutation({ mutationFn: opts.create, onSuccess: () => { done(); toast.success(`${opts.label} added`); }, onError: fail });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<I> }) => opts.update(id, patch),
    onSuccess: () => { done(); toast.success(`${opts.label} updated`); },
    onError: fail,
  });
  const remove = useMutation({ mutationFn: opts.remove, onSuccess: () => { done(); toast.success(`${opts.label} deleted`); }, onError: fail });
  return { query, create, update, remove };
}
