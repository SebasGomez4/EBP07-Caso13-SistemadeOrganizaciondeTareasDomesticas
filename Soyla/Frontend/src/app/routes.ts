import { createBrowserRouter } from "react-router";
import { RootLayout } from "./RootLayout";
import {
  LoginPage,
  RegisterPage,
  HomePage,
  CreateGroupPage,
  GroupCreatedPage,
  GroupViewPage,
  ProfilePage,
  EditProfilePage,
  InviteAccessPage,
} from "./ProtectedPages";

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: "/",
        Component: LoginPage,
      },
      {
        path: "/register",
        Component: RegisterPage,
      },
      {
        path: "/home",
        Component: HomePage,
      },
      {
        path: "/crear-grupo",
        Component: CreateGroupPage,
      },
      {
        path: "/grupo-creado",
        Component: GroupCreatedPage,
      },
      {
        path: "/grupo/:groupId",
        Component: GroupViewPage,
      },
      {
        path: "/perfil",
        Component: ProfilePage,
      },
      {
        path: "/editar-perfil",
        Component: EditProfilePage,
      },
      {
        path: "/unirse/:inviteCode",
        Component: InviteAccessPage,
      },
    ],
  },
]);
