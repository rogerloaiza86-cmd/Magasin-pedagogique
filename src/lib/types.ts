

export type Environment = {
    id: string;
    name: string;
    description: string;
}

export type ArticleStatus = 'Actif' | 'Bloqué' | 'En contrôle qualité' | 'Obsolète' | 'En attente de rangement' | 'Au rebut';

export type Article = {
  id: string;
  name: string;
  location: string;
  stock: number;
  price: number;
  packaging: string;
  environnementId: string;
  status: ArticleStatus;
  ean?: string;
  weight?: number; 
  dimensions?: { length: number; width: number; height: number }; 
  supplierIds?: number[];
};

export type TierType = 'Client' | 'Fournisseur' | 'Transporteur' | 'Vehicule';

export type VehicleStatus = "Disponible" | "En Tournée" | "En Maintenance" | "Hors Service";

export type Tier = {
  id: number;
  type: TierType;
  name: string; 
  address: string; 
  createdAt: string;
  createdBy: string;
  environnementId: string;
  email?: string;
  
  immatriculation?: string; 
  capacitePalette?: number; 
  status?: VehicleStatus;
  chauffeurActuelId?: string | null;
  tourneeActuelleId?: string | null;
  echeanceControleTechnique?: string;
  echeanceAssurance?: string;
  kilometrage?: number;
  coutKm?: number;
};

export type Maintenance = {
    id: number;
    environnementId: string;
    vehiculeId: number;
    vehiculeImmat: string;
    typeMaintenance: string; 
    dateEcheance: string;
    status: "Planifiée" | "En cours" | "Terminée" | "Annulée";
    dateRealisation?: string | null;
    kilometrageRealisation?: number | null;
    cout?: number | null;
    notes?: string;
}

export type ReturnReason = "Erreur de commande" | "Article défectueux" | "Endommagé au transport" | "Autre";
export type ReturnDecision = "Réintégrer en stock" | "Mettre au rebut";

export type DocumentLine = {
  articleId: string;
  quantity: number; 
  quantityReceived?: number;
  quantityNonConforming?: number;
  returnReason?: ReturnReason;
  returnDecision?: ReturnDecision;
};

export type DocumentStatus = 'En préparation' | 'Prêt pour expédition' | 'Validé' | 'Expédié' | 'Réceptionné' | 'Réceptionné avec anomalies' | 'En attente de traitement' | 'Traité' | 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé';


export type Document = {
  id: number;
  type: 'Bon de Commande Fournisseur' | 'Bon de Livraison Client' | 'Lettre de Voiture' | 'Retour Client';
  tierId: number;
  status: DocumentStatus;
  lines: DocumentLine[];
  createdAt: string;
  createdBy: string;
  transporterId?: number; 
  environnementId: string;
  receptionNotes?: string; 
  originalDocumentId?: number; 
};

export type Movement = {
  id: number;
  timestamp: string;
  articleId: string;
  type: 'Entrée (Réception BC)' | 'Sortie (Expédition BL)' | 'Ajustement Inventaire' | 'Initial' | 'Génération' | 'Mise en non-conforme' | 'Retour Client';
  quantity: number;
  stockAfter: number;
  user: string;
  environnementId: string;
  documentId?: number;
};

export type UserProfile = 'élève' | 'professeur' | 'Administrateur';

export type Permissions = {
    isSuperAdmin: boolean;
    canViewDashboard: boolean;
    canManageTiers: boolean;
    canViewTiers: boolean;
    canCreateBC: boolean;
    canReceiveBC: boolean;
    canCreateBL: boolean;
    canPrepareBL: boolean;
    canShipBL: boolean;
    canManageStock: boolean;
    canViewStock: boolean;
    canManageClasses: boolean;
    canUseMessaging: boolean;
    profile: UserProfile;
}

export type Role = {
    id: string;
    name: string;
    description: string;
    isStudentRole: boolean;
    permissions: Permissions;
}

export type User = {
  username: string;
  password: string; 
  profile: UserProfile;
  classId?: number;
  createdAt: string;
  roleId: string; 
}

export type Class = {
    id: number;
    name:string;
    teacherIds?: string[]; 
}

export type Email = {
  id: number;
  sender: string; 
  recipient: string; 
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
};
