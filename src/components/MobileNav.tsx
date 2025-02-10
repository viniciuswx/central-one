import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="grid gap-2 py-6">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="text-sm font-medium hover:underline"
          >
            Dashboard
          </Link>

          <h4 className="font-medium text-sm py-2 mt-4">Visitantes</h4>
          <Link
            to="/visitantes/cadastro"
            onClick={() => setOpen(false)}
            className="text-sm font-medium hover:underline"
          >
            Cadastrar Visitante
          </Link>
          <Link
            to="/visitantes/lista"
            onClick={() => setOpen(false)}
            className="text-sm font-medium hover:underline"
          >
            Lista de Visitantes
          </Link>

          <h4 className="font-medium text-sm py-2 mt-4">Membros</h4>
          <Link
            to="/membros/cadastro"
            onClick={() => setOpen(false)}
            className="text-sm font-medium hover:underline"
          >
            Cadastrar Membro
          </Link>
          <Link
            to="/membros/lista"
            onClick={() => setOpen(false)}
            className="text-sm font-medium hover:underline"
          >
            Lista de Membros
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
