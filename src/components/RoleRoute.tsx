import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface RoleRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export function RoleRoute({ children, requiredRole }: RoleRouteProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(requiredRole)) {
    return <Navigate to="/" />;
  }

  return children;
}
