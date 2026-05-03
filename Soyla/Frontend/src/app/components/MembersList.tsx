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
import { type GroupMember, updateGroupMemberRole, listGroupMembers } from "../lib/api";

interface MembersListProps {
  groupId: string;
  currentUserEmail: string;
  currentUserRole: "Administrador" | "Coadministrador" | "Colaborador";
}

export function MembersList({ groupId, currentUserEmail, currentUserRole }: MembersListProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    const loadMembers = async () => {
      const loadedMembers = await listGroupMembers(groupId);
      setMembers(loadedMembers);
    };

    void loadMembers();
  }, [groupId]);

  const isAdmin = currentUserRole === "Administrador";

  const handleRoleChange = async (memberEmail: string, newRole: GroupMember["role"]) => {
    await updateGroupMemberRole(groupId, memberEmail, {
      role: newRole,
      requestedByEmail: currentUserEmail,
    });

    setMembers((prev) =>
      prev.map((member) =>
        member.email === memberEmail
          ? { ...member, role: newRole }
          : member
      )
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Administrador":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "Coadministrador":
        return <UserCog className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "Administrador":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Coadministrador":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (members.length === 0) {
    return (
      <Card className="shadow-sm border-purple-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Miembros del grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No hay miembros en este grupo todavia.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-purple-100">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Miembros del grupo
        </CardTitle>
        <CardDescription>
          {members.length === 1 ? "1 miembro en el grupo" : `${members.length} miembros en el grupo`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.email}
              className="flex items-center justify-between p-4 bg-white border border-purple-100 rounded-lg hover:border-purple-200 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-purple-600 text-sm font-medium">
                    {member.fullName
                      .trim()
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0].toUpperCase())
                      .join("")}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-800 truncate">
                      {member.fullName}
                      {member.email === currentUserEmail && (
                        <span className="text-purple-600 text-sm ml-1.5">(Tu)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getRoleBadgeStyle(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin && member.email !== currentUserEmail && (
                <div className="ml-4 shrink-0">
                  <Select
                    value={member.role}
                    onValueChange={(value) => void handleRoleChange(member.email, value as GroupMember["role"])}
                  >
                    <SelectTrigger className="w-[160px] h-9 text-sm border-purple-200 hover:bg-purple-50">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
