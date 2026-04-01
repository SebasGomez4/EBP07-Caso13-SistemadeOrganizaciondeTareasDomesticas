import { createBrowserRouter } from "react-router";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { CreateGroup } from "./pages/CreateGroup";
import { GroupCreated } from "./pages/GroupCreated";
import { GroupView } from "./pages/GroupView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/home",
    Component: Home,
  },
  {
    path: "/crear-grupo",
    Component: CreateGroup,
  },
  {
    path: "/grupo-creado",
    Component: GroupCreated,
  },
  {
    path: "/grupo/:groupId",
    Component: GroupView,
  },
]);
