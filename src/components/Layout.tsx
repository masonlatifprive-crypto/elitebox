/**
 * Layout (design.md §10): Root structural wrapper with ambient fade masks,
 * global navigation rail (AppRail), and responsive content area.
 */
import { Outlet } from "react-router-dom";
import AppRail from "./AppRail";
import { useT } from "@/i18n";

export function Layout() {
  const { t } = useT();

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Left: Global Navigation Rail */}
      <AppRail />

      {/* Right: Main Content Area */}
      <main id="main-content" className="relative flex-1 overflow-y-auto overflow-x-hidden">
        {/* Ambient Top/Bottom Fade Masks */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-background to-transparent" />

        {/* Content Outlet */}
        <div className="relative z-0 min-h-full pb-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export const AppShell = Layout;
export const MarketingShell = Layout;
export default Layout;
