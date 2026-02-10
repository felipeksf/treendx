import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3 } from "lucide-react";

const mockUsers = [
  { name: "João Silva", email: "joao@email.com", status: "trial", expiresAt: "2026-02-17" },
  { name: "Maria Santos", email: "maria@email.com", status: "ativo", expiresAt: "2026-08-10" },
  { name: "Pedro Costa", email: "pedro@email.com", status: "expirado", expiresAt: "2026-01-05" },
  { name: "Ana Souza", email: "ana@email.com", status: "trial", expiresAt: "2026-02-20" },
  { name: "Carlos Lima", email: "carlos@email.com", status: "ativo", expiresAt: "2026-12-01" },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    trial: "bg-primary/10 text-primary border-primary/20",
    ativo: "bg-treend-success/10 text-treend-success border-treend-success/20",
    expirado: "bg-treend-danger/10 text-treend-danger border-treend-danger/20",
  };
  return map[status] || "";
};

const AdminUsers = () => {
  const active = mockUsers.filter((u) => u.status !== "expirado").length;
  const trials = mockUsers.filter((u) => u.status === "trial").length;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Gestão de Usuários
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border border-border/40 p-4 text-center">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 mx-auto mb-2">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{mockUsers.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/40 p-4 text-center">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-treend-success/10 mx-auto mb-2">
            <BarChart3 className="h-4 w-4 text-treend-success" />
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{active}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ativos</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/40 p-4 text-center">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-treend-warning/10 mx-auto mb-2">
            <BarChart3 className="h-4 w-4 text-treend-warning" />
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{trials}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Em trial</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40">
          <span className="text-sm font-semibold text-foreground">Usuários cadastrados</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40">
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">E-mail</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Expiração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => (
                <TableRow key={u.email} className="border-border/40">
                  <TableCell className="text-sm font-medium text-foreground">{u.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadge(u.status)}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.expiresAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
