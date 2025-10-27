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
import { Eye } from "lucide-react";
import Link from "next/link";
import { Document } from "@/lib/types";

export function DocumentsClient() {
  const { state, getTier } = useWms();
  const documents = Array.from(state.documents.values()).sort((a,b) => b.id - a.id);

  const getStatusVariant = (status: Document['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'En préparation': return 'secondary';
        case 'Validé':
        case 'Réceptionné':
        case 'Expédié':
            return 'default';
        default: return 'outline';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les documents</CardTitle>
        <CardDescription>
          Consultez tous les bons de commande, bons de livraison et lettres de voiture créés.
        </CardDescription>
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
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.id}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{getTier(doc.tierId)?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                  </TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucun document n'a encore été créé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
