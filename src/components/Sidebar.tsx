import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  List,
  ClipboardCheck,
  Cake,
  Menu,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import logoCO from "@/assets/centralone.jpg";
import { Logo } from "./ui/logo";

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
    },
    {
      title: "Registrar Presença",
      icon: ClipboardCheck,
      path: "/presenca",
    },
    {
      title: "Aniversariantes",
      icon: Cake,
      path: "/aniversariantes",
    },
    {
      title: "Visitantes",
      icon: Users,
      submenu: [
        {
          title: "Cadastrar",
          icon: UserPlus,
          path: "/visitantes/cadastro",
        },
        {
          title: "Listar",
          icon: List,
          path: "/visitantes/lista",
        },
      ],
    },
    {
      title: "Membros",
      icon: Users,
      submenu: [
        {
          title: "Cadastrar",
          icon: UserPlus,
          path: "/membros/cadastro",
        },
        {
          title: "Listar",
          icon: List,
          path: "/membros/lista",
        },
      ],
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-3 space-y-1">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.submenu ? (
                <div className="pt-3">
                  <h2 className="mb-2 px-4 text-zinc-400 text-xs uppercase tracking-wider font-medium">
                    {item.title}
                  </h2>
                  <div className="space-y-1">
                    {item.submenu.map((subItem, subIndex) => (
                      <MenuItem
                        key={subIndex}
                        {...subItem}
                        isActive={location.pathname === subItem.path}
                        onClick={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <MenuItem
                  {...item}
                  isActive={location.pathname === item.path}
                  onClick={() => setOpen(false)}
                />
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoCO} className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Central One
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                The best rolê
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200/50 dark:border-zinc-800/50"
          >
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 z-50 hidden lg:block">
      <SidebarContent />
    </aside>
  );
}

interface MenuItemProps {
  title: string;
  icon: any;
  path: string;
  isActive: boolean;
  onClick?: () => void;
}

function MenuItem({
  title,
  icon: Icon,
  path,
  isActive,
  onClick,
}: MenuItemProps) {
  return (
    <Link to={path} onClick={onClick}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          isActive
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
      >
        <Icon className="mr-2 h-4 w-4" />
        {title}
      </Button>
    </Link>
  );
}
