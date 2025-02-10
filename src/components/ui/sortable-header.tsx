import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: {
    field: string;
    direction: "asc" | "desc" | null;
  };
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort.field === field;
  const direction = isActive ? currentSort.direction : null;

  return (
    <TableHead
      onClick={() => onSort(field)}
      className={cn(
        "cursor-pointer select-none transition-colors hover:text-zinc-900 dark:hover:text-zinc-100",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">{label}</span>
        <div className="w-4">
          {isActive ? (
            direction === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : direction === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
          )}
        </div>
      </div>
    </TableHead>
  );
}
