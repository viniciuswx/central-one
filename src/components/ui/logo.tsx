import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link
      to="/"
      className="text-xl font-medium text-zinc-900 dark:text-zinc-100"
    >
      Central One 2025
    </Link>
  );
}
