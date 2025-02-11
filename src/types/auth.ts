export type UserRole = "lider" | "voluntario";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  nome?: string;
}
