
"use client";

import { useWms } from "@/context/WmsContext";
import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Boxes, Printer } from "lucide-react";
import { useEffect, useState } from "react";

export default function DocumentViewPage() {
    const { id } = useParams();
    const { getDocument, getTier, getArticle } = useWms();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const docId = parseInt(id as string, 10);
    const doc = getDocument(docId);

    if (!isClient) {
        return null; // or a loading skeleton
    }

    if (!doc) {
        return notFound();
    }
    
    const tier = getTier(doc.tierId);
    const transporter = doc.transporterId ? getTier(doc.transporterId) : null;

    const handlePrint = () => {
        window.print();
    }

    const renderTitle = () => {
        switch(doc.type) {
            case 'Bon de Commande Fournisseur': return `Bon de Commande Fournisseur #${doc.id}`;
            case 'Bon de Livraison Client': return `Bon de Livraison #${doc.id}`;
            case 'Lettre de Voiture': return `Lettre de Voiture (CMR) #${doc.id}`;
            default: return `Document #${doc.id}`;
        }
    }
    
    const totalArticles = doc.lines.reduce((acc, line) => acc + line.quantity, 0);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-background">
            <div className="flex justify-between items-start mb-6 print:hidden">
                <h1 className="text-2xl font-bold">Aperçu du Document</h1>
                <Button onClick={handlePrint}><Printer className="mr-2" /> Imprimer / PDF</Button>
            </div>
            
            <Card className="print:shadow-none print:border-none">
                <CardHeader className="bg-muted/30 p-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Boxes className="h-12 w-12 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold">Magasin Pédagogique</h1>
                                <p className="text-sm text-muted-foreground">Lycée Gaspard Monge</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <CardTitle className="text-3xl font-bold text-primary">{renderTitle()}</CardTitle>
                            <CardDescription>Date: {new Date(doc.createdAt).toLocaleDateString()}</CardDescription>
                        </div>
                     </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold mb-2">
                                {doc.type === 'Bon de Commande Fournisseur' ? 'Fournisseur' : 'Expéditeur'}
                            </h3>
                            <p className="not-prose">
                                <strong>Magasin Pédagogique</strong><br />
                                Lycée Gaspard Monge<br />
                                1 Pl. Monge<br />
                                91600, Savigny-sur-Orge
                            </p>
                        </div>
                        <div className="text-right">
                             <h3 className="font-semibold mb-2">
                                {doc.type === 'Bon de Commande Fournisseur' ? 'Adresse de Livraison' : 'Destinataire'}
                            </h3>
                             {tier ? (
                                <p className="not-prose">
                                    <strong>{tier.name}</strong><br />
                                    {tier.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br/></span>)}
                                </p>
                            ) : <p>N/A</p>}
                        </div>
                    </div>
                    
                    {transporter && (
                        <div className="mb-8">
                             <h3 className="font-semibold mb-2">Transporteur</h3>
                             {transporter ? (
                                <p className="not-prose">
                                    <strong>{transporter.name}</strong><br />
                                     {transporter.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br/></span>)}
                                </p>
                            ) : <p>N/A</p>}
                        </div>
                    )}

                    <Separator className="my-6" />

                    <h3 className="font-semibold mb-4 text-lg">Détail des Articles</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>Désignation</TableHead>
                                <TableHead>Conditionnement</TableHead>
                                <TableHead className="text-right">Quantité</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doc.lines.map((line, index) => {
                                const article = getArticle(line.articleId);
                                return (
                                    <TableRow key={index}>
                                        <TableCell className="font-mono">{article?.id || 'N/A'}</TableCell>
                                        <TableCell>{article?.name || 'Article inconnu'}</TableCell>
                                        <TableCell>{article?.packaging || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-bold">{line.quantity}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                     <Separator className="my-6" />

                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-4">
                            <h3 className="font-semibold">Notes</h3>
                            <p className="text-sm text-muted-foreground">Document généré par le WMS Pédagogique.</p>
                             {doc.type === 'Lettre de Voiture' && (
                                <div className="border rounded-lg p-4 space-y-4">
                                    <h4 className="font-semibold">Réserves du transporteur</h4>
                                    <div className="h-20 border-b"></div>
                                    <h4 className="font-semibold">Date et Signature</h4>
                                    <div className="h-20"></div>
                                </div>
                             )}
                        </div>
                        <div className="text-right">
                           <p>Total articles:</p>
                           <p className="text-2xl font-bold">{totalArticles}</p>
                           <p className="mt-8">Statut:</p>
                           <p className="font-bold text-primary">{doc.status}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Add specific print styles
const styles = `
@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print\\:hidden {
    display: none;
  }
  .print\\:shadow-none {
    box-shadow: none;
  }
  .print\\:border-none {
    border: none;
  }
  main {
    padding: 0 !important;
  }
}
`;

const styleSheet = typeof window !== 'undefined' ? new CSSStyleSheet() : null;
if (styleSheet) {
    styleSheet.replaceSync(styles);
    if (typeof window !== 'undefined') {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
    }
}
