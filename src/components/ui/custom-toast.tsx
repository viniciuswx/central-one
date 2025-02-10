import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ToastProps {
  title: string;
  type?: "success" | "error";
}

export function showToast({ title, type = "success" }: ToastProps) {
  const { toast } = useToast();

  toast({
    duration: 3000,
    className:
      type === "success"
        ? "bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50 border-green-200 dark:border-green-800"
        : "bg-red-50 text-red-900 dark:bg-red-900 dark:text-red-50 border-red-200 dark:border-red-800",
    description: (
      <div className="flex items-center gap-2">
        {type === "success" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        {title}
      </div>
    ),
  });
}
