import { Outlet } from "react-router";
import { SessionManager } from "./SessionManager";

export function RootLayout() {
  return (
    <SessionManager>
      <Outlet />
    </SessionManager>
  );
}
