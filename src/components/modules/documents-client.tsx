
"use client";

import { useWms } from "@/context/WmsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import Link from "next/link";
import { Document } from "@/lib/types";

export function DocumentsClient() {
  const { state, getTier, getArticle } = useWms();
  const { currentUser, currentUserPermissions, currentEnvironmentId, documents, users, roles } = state;
  
  const docsInEnv = Array.from(state.documents.values()).filter(doc => doc.environnementId === currentEnvironmentId);

  const viewableDocuments = currentUserPermissions?.isSuperAdmin 
    ? docsInEnv
    : docsInEnv.filter(doc => doc.createdBy === currentUser?.username);

  viewableDocuments.sort((a,b) => b.id - a.id);

  const getStatusVariant = (status: Document['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'En préparation': return 'secondary';
        case 'Validé':
        case 'Réceptionné':
        case 'Expédié':
        case 'Accepté':
            return 'default';
        case 'Réceptionné avec anomalies':
        case 'Refusé':
            return 'destructive';
        default: return 'outline';
    }
  }
  
  const getCreatorSignature = (username: string) => {
    const user = users.get(username);
    if (!user) return username;
    const roleName = roles.get(user.roleId)?.name || user.profile;
    return `${user.username} (${roleName})`;
  }

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Type,Tiers,Date,Statut,Articles,CreePar\n";

    viewableDocuments.forEach(doc => {
      const tierName = getTier(doc.tierId)?.name || "N/A";
      const articles = doc.lines.map(l => `${getArticle(l.articleId)?.name} (x${l.quantity})`).join('; ');
      const creator = getCreatorSignature(doc.createdBy);
      const row = [
        doc.id,
        doc.type,
        `"${tierName.replace(/"/g, '""')}"`,
        new Date(doc.createdAt).toLocaleDateString(),
        doc.status,
        `"${articles.replace(/"/g, '""')}"`,
        `"${creator.replace(/"/g, '""')}"`,
      ].join(',');
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historique_documents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Card>
      <CardHeader className="flex-row justify-between items-start">
        <div>
            <CardTitle>Documents de l'environnement</CardTitle>
            <CardDescription>
              Consultez tous les documents créés dans cet environnement. Les administrateurs voient tout, les autres ne voient que leurs propres documents.
            </CardDescription>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={viewableDocuments.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exporter la vue en CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tiers</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé par</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewableDocuments.length > 0 ? (
              viewableDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.id}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{getTier(doc.tierId)?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{getCreatorSignature(doc.createdBy)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/documents/${doc.id}`} passHref>
                        <Button variant="outline" size="sm" asChild>
                            <div>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir
                            </div>
                        </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Aucun document n'a encore été créé dans cet environnement.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
