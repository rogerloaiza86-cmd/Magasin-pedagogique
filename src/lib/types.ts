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
  user: string;
};

export type UserProfile = 'élève' | 'professeur' | 'Administrateur';

export type User = {
  username: string;
  password: string; // In a real app, this should be a hash
  profile: UserProfile;
  classId?: number;
}

export type Class = {
    id: number;
    name: string;
    teacherId?: string; // username of the teacher
}

export type Email = {
  id: number;
  sender: string; // username
  recipient: string; // username
  cc?: string[]; // for the teacher copy
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
};
