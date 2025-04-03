
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("serve-tracker-auth");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
      variant: "default"
    });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-14 items-center px-4">
        <Link to="/dashboard" className="flex items-center font-bold">
          ServeTracker
        </Link>
        <nav className="mx-6 flex flex-1 items-center justify-between sm:justify-end space-x-4">
          <div className="flex items-center space-x-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/new-serve"
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )
              }
            >
              New Serve
            </NavLink>
            <NavLink
              to="/clients"
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )
              }
            >
              Clients
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )
              }
            >
              History
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )
              }
            >
              Settings
            </NavLink>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="ml-4"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
