import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Shield, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "editor" | "user";

interface UserRow {
  user_id: string;
  full_name: string | null;
  subscription_status: string;
  trial_expires_at: string | null;
  roles: AppRole[];
  email?: string;
}

const roleBadge: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  editor: "bg-treend-warning/10 text-treend-warning border-treend-warning/20",
  user: "bg-muted text-muted-foreground border-border",
};

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  user: "Usuário",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("editor");
  const [searchEmail, setSearchEmail] = useState("");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, subscription_status, trial_expires_at")
      .order("created_at", { ascending: false });

    // Fetch all roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (profiles) {
      const rolesMap: Record<string, AppRole[]> = {};
      roles?.forEach((r) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role as AppRole);
      });

      const mapped: UserRow[] = profiles.map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        subscription_status: p.subscription_status,
        trial_expires_at: p.trial_expires_at,
        roles: rolesMap[p.user_id] || ["user"],
      }));
      setUsers(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSetRole = async (userId: string, role: AppRole) => {
    // Remove existing admin/editor roles first
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .in("role", ["admin", "editor"]);

    if (role !== "user") {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) {
        toast({ title: "Erro ao atualizar role", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: `Role atualizado para ${roleLabel[role]}` });
    fetchUsers();
    setEditingUser(null);
  };

  const handleRemoveRole = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast({ title: "Você não pode remover seu próprio acesso", variant: "destructive" });
      return;
    }
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .in("role", ["admin", "editor"]);

    toast({ title: "Acesso administrativo removido" });
    fetchUsers();
  };

  const adminEditorUsers = users.filter(
    (u) => u.roles.includes("admin") || u.roles.includes("editor")
  );
  const regularUsers = users.filter(
    (u) => !u.roles.includes("admin") && !u.roles.includes("editor")
  );

  const filteredRegular = searchEmail
    ? regularUsers.filter((u) =>
        (u.full_name || "").toLowerCase().includes(searchEmail.toLowerCase())
      )
    : regularUsers;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Gestão de Usuários
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border border-border/40 p-4 text-center">
          <p className="text-xl font-bold text-foreground tabular-nums">{users.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/40 p-4 text-center">
          <p className="text-xl font-bold text-foreground tabular-nums">
            {adminEditorUsers.filter((u) => u.roles.includes("admin")).length}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admins</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/40 p-4 text-center">
          <p className="text-xl font-bold text-foreground tabular-nums">
            {adminEditorUsers.filter((u) => u.roles.includes("editor")).length}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Editores</p>
        </div>
      </div>

      {/* Admin & Editor users */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Administradores & Editores
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40">
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminEditorUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum administrador ou editor.
                  </TableCell>
                </TableRow>
              ) : (
                adminEditorUsers.map((u) => {
                  const highestRole = u.roles.includes("admin") ? "admin" : "editor";
                  return (
                    <TableRow key={u.user_id} className="border-border/40">
                      <TableCell className="text-sm font-medium text-foreground">
                        {u.full_name || "Sem nome"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleBadge[highestRole]}>
                          {roleLabel[highestRole]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingUser(u)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {u.user_id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveRole(u.user_id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* All users - promote to admin/editor */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Todos os Usuários</span>
          <Input
            placeholder="Buscar por nome..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-48 h-8 text-xs"
          />
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40">
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Promover</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegular.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegular.map((u) => (
                  <TableRow key={u.user_id} className="border-border/40">
                    <TableCell className="text-sm font-medium text-foreground">
                      {u.full_name || "Sem nome"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        u.subscription_status === "active"
                          ? "bg-treend-success/10 text-treend-success border-treend-success/20"
                          : u.subscription_status === "trial"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-treend-danger/10 text-treend-danger border-treend-danger/20"
                      }>
                        {u.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleSetRole(u.user_id, "editor")}
                        >
                          <Plus className="h-3 w-3" />
                          Editor
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleSetRole(u.user_id, "admin")}
                        >
                          <Plus className="h-3 w-3" />
                          Admin
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit role dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Role — {editingUser?.full_name || "Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select
              value={
                editingUser?.roles.includes("admin")
                  ? "admin"
                  : editingUser?.roles.includes("editor")
                  ? "editor"
                  : "user"
              }
              onValueChange={(val) => {
                if (editingUser) handleSetRole(editingUser.user_id, val as AppRole);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="user">Usuário (sem acesso admin)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
