export type Article = {
  id: string;
  name: string;
  location: string;
  stock: number;
  price: number;
  packaging: string;
};

export type Tier = {
  id: number;
  type: 'Client' | 'Fournisseur' | 'Transporteur';
  name: string;
  address: string;
};

export type DocumentLine = {
  articleId: string;
  quantity: number;
};

export type Document = {
  id: number;
  type: 'Bon de Commande Fournisseur' | 'Bon de Livraison Client' | 'Lettre de Voiture';
  tierId: number;
  status: 'En préparation' | 'Validé' | 'Expédié' | 'Réceptionné';
  lines: DocumentLine[];
  createdAt: string;
  transporterId?: number; // For CMR
};

export type Movement = {
  id: number;
  timestamp: string;
  articleId: string;
  type: 'Entrée (Réception BC)' | 'Sortie (Expédition BL)' | 'Ajustement Inventaire' | 'Initial';
  quantity: number;
  stockAfter: number;
};
