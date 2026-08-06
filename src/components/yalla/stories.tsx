import { Plus } from "lucide-react";
import { stories } from "@/lib/yalla-data";

export function Stories() {
  return (
    <section aria-label="Stories" className="glass rounded-3xl p-3">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        {stories.map((s, i) => (
          <button
            key={s.id}
            style={{ animationDelay: `${i * 45}ms` }}
            className="group relative h-40 w-26 min-w-[6.5rem] shrink-0 animate-rise overflow-hidden rounded-2xl ring-1 ring-border/60 transition-transform duration-300 hover:-translate-y-1"
          >
            <img
              src={s.cover}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            {s.self ? (
              <span className="absolute left-1/2 top-3 grid size-8 -translate-x-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift">
                <Plus className="size-4" />
              </span>
            ) : (
              <span className="absolute left-2 top-2 size-8 rounded-full bg-gradient-to-br from-gold to-primary p-[2px]">
                <span className="grid size-full place-items-center rounded-full bg-card text-[10px] font-bold text-foreground">
                  {s.initials}
                </span>
              </span>
            )}
            <span className="absolute inset-x-2 bottom-2 truncate text-left text-xs font-semibold text-white">
              {s.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}