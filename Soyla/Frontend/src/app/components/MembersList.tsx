import { useState, useEffect } from "react";
import { Users, Shield, UserCog, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Member {
  email: string;
  fullName: string;
  role: "Administrador" | "Coadministrador" | "Colaborador";
}

interface MembersListProps {
  groupId: string;
  currentUserEmail: string;
  currentUserRole: "Administrador" | "Coadministrador" | "Colaborador";
}

function loadMembers(groupId: string): Member[] {
  const groupMembers: Record<string, string[]> = JSON.parse(
    localStorage.getItem("groupMembers") || "{}"
  );
  const memberEmails = groupMembers[groupId] || [];

  const groupRoles: Record<string, Record<string, string>> = JSON.parse(
    localStorage.getItem("groupRoles") || "{}"
  );
  const rolesMap = groupRoles[groupId] || {};

  const users: Array<{ email: string; fullName: string }> = JSON.parse(
    localStorage.getItem("users") || "[]"
  );

  return memberEmails.map((email) => {
    const user = users.find((u) => u.email === email);
    return {
      email,
      fullName: user?.fullName || email,
      role: (rolesMap[email] as "Administrador" | "Coadministrador" | "Colaborador") || "Colaborador",
    };
  });
}

export function MembersList({ groupId, currentUserEmail, currentUserRole }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>(() => loadMembers(groupId));

  useEffect(() => {
    setMembers(loadMembers(groupId));
  }, [groupId]);

  const isAdmin = currentUserRole === "Administrador";

  const handleRoleChange = (memberEmail: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.email === memberEmail
          ? { ...m, role: newRole as "Administrador" | "Coadministrador" | "Colaborador" }
          : m
      )
    );

    const groupRoles: Record<string, Record<string, string>> = JSON.parse(
      localStorage.getItem("groupRoles") || "{}"
    );
    if (!groupRoles[groupId]) {
      groupRoles[groupId] = {};
    }
    groupRoles[groupId][memberEmail] = newRole;
    localStorage.setItem("groupRoles", JSON.stringify(groupRoles));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Administrador":
        return <Shield className="h-3.5 w-3.5 text-purple-600" />;
      case "Coadministrador":
        return <UserCog className="h-3.5 w-3.5 text-blue-600" />;
      case "Colaborador":
        return <User className="h-3.5 w-3.5 text-gray-600" />;
      default:
        return <User className="h-3.5 w-3.5 text-gray-600" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "Administrador":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Coadministrador":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Colaborador":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  if (members.length === 0) {
    return (
      <Card className="border-purple-100/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Miembros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay miembros en este grupo.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-100/50 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-600" />
          Miembros
        </CardTitle>
        <CardDescription className="text-xs">
          {members.length} {members.length === 1 ? "miembro" : "miembros"} en el grupo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((member) => {
          const isMe = member.email === currentUserEmail;
          return (
            <div
              key={member.email}
              className={`group flex items-center gap-3 p-3 rounded-lg transition-all ${
                isMe
                  ? "bg-purple-50/50 border border-purple-200/50"
                  : "bg-white border border-gray-100 hover:border-purple-200/50 hover:bg-purple-50/30"
              }`}
            >
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isMe
                  ? "bg-gradient-to-br from-purple-600 to-blue-600"
                  : "bg-gradient-to-br from-purple-100 to-blue-100"
              }`}>
                <span className={`text-xs font-semibold ${isMe ? "text-white" : "text-purple-700"}`}>
                  {member.fullName
                    .trim()
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0].toUpperCase())
                    .join("")}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.fullName}
                  {isMe && (
                    <span className="ml-1.5 text-xs text-purple-600 font-normal">(Tú)</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getRoleIcon(member.role)}
                  <span className="text-xs text-gray-500">{member.role}</span>
                </div>
              </div>

              {/* Role selector (solo admin) */}
              {isAdmin && !isMe && (
                <div className="shrink-0">
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.email, value)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 hover:border-purple-300 hover:bg-purple-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Coadministrador">Coadministrador</SelectItem>
                      <SelectItem value="Colaborador">Colaborador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Badge de rol (no admin o es el usuario actual) */}
              {(!isAdmin || isMe) && (
                <div
                  className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${getRoleBadgeStyle(
                    member.role
                  )}`}
                >
                  {getRoleIcon(member.role)}
                  {member.role}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
