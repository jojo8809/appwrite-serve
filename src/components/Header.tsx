
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut, Home, Users, History, FileText, Settings } from "lucide-react";
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
        <Link to="/dashboard" className="flex items-center font-bold mr-6">
          ServeTracker
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                isActive ? "text-foreground" : "text-muted-foreground"
              )
            }
          >
            <Home className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                isActive ? "text-foreground" : "text-muted-foreground"
              )
            }
          >
            <Users className="h-4 w-4" />
            Clients
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                isActive ? "text-foreground" : "text-muted-foreground"
              )
            }
          >
            <History className="h-4 w-4" />
            History
          </NavLink>
          <NavLink
            to="/export"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                isActive ? "text-foreground" : "text-muted-foreground"
              )
            }
          >
            <FileText className="h-4 w-4" />
            Export
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigate('/new-serve')}
            className="flex items-center"
          >
            <span className="mr-1">+</span> New Serve
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
