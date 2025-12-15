import { useRef } from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import Header from "../components/header";
import { AppSidebar } from "../components/appSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NavBarProvider } from "../context/navBarContext";

const RootLayout = () => {
  const headerRef = useRef<HTMLDivElement>(null);

  return (
    <SidebarProvider>
      <div className="app-layout flex h-screen w-full">
        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
            <SidebarTrigger className="text-foreground" />
            <div className="flex-1">
              <Header ref={headerRef} />
            </div>
          </header>

          <main
            className="content flex-1 overflow-auto px-4 py-2 bg-background"
            role="main"
          >
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export const Route = createRootRoute({
  component: () => {
    return (
      <NavBarProvider>
        <RootLayout />
      </NavBarProvider>
    );
  },
});
