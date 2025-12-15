import {
  AiFillDashboard,
  AiOutlineBarChart,
  AiOutlinePieChart,
  AiOutlineLineChart,
  AiOutlineAreaChart,
  AiOutlineDotChart,
  AiOutlineUpload,
  AiOutlineGlobal,
  AiOutlineDatabase,
} from "react-icons/ai";
import { MdRadar, MdAccountTree } from "react-icons/md";
import { TbChartDots3 } from "react-icons/tb";
import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    name: "Dashboard",
    icon: <AiFillDashboard className="text-3xl" />,
    path: "/",
  },
  {
    name: "Geographic",
    icon: <AiOutlineGlobal className="text-3xl" />,
    path: "/geographic",
  },
  {
    name: "Comparison",
    icon: <AiOutlineBarChart className="text-3xl" />,
    path: "/comparison",
  },
  {
    name: "Composition",
    icon: <AiOutlinePieChart className="text-3xl" />,
    path: "/composition",
  },
  {
    name: "Trends",
    icon: <AiOutlineLineChart className="text-3xl" />,
    path: "/trends",
  },
  {
    name: "ML Forecast",
    icon: <TbChartDots3 className="text-3xl" />,
    path: "/forecast",
  },
  {
    name: "Distribution",
    icon: <AiOutlineAreaChart className="text-3xl" />,
    path: "/distribution",
  },
  {
    name: "Relationships",
    icon: <AiOutlineDotChart className="text-3xl" />,
    path: "/relationships",
  },
  {
    name: "Ranking",
    icon: <MdRadar className="text-3xl" />,
    path: "/radar",
  },
  {
    name: "Flow/Process",
    icon: <MdAccountTree className="text-3xl" />,
    path: "/parallel",
  },
  {
    name: "Upload Data",
    icon: <AiOutlineUpload className="text-3xl" />,
    path: "/upload",
  },
  {
    name: "Data Management",
    icon: <AiOutlineDatabase className="text-3xl" />,
    path: "/crud",
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary text-2xl font-bold px-8 py-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.path}
                      className="flex items-center gap-5 px-8 py-4 text-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
