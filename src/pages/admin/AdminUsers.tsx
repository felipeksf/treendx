import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    expirado: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return map[status] || "";
};

const AdminUsers = () => {
  const active = mockUsers.filter((u) => u.status !== "expirado").length;
  const trials = mockUsers.filter((u) => u.status === "trial").length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        Gestão de Usuários
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">{mockUsers.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <BarChart3 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">{active}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <BarChart3 className="h-5 w-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">{trials}</p>
            <p className="text-xs text-muted-foreground">Em trial</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((u) => (
                  <TableRow key={u.email}>
                    <TableCell className="text-sm font-medium text-foreground">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge(u.status)}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.expiresAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
