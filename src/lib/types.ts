

export type Environment = {
    id: string;
    name: string;
    type: 'WMS' | 'TMS';
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
  // New fields
  status: ArticleStatus;
  ean?: string;
  weight?: number; // in kg
  dimensions?: { length: number; width: number; height: number }; // in cm
  supplierIds?: number[];
};

export type TierType = 'Client' | 'Fournisseur' | 'Transporteur' | 'Vehicule';

export type VehicleStatus = "Disponible" | "En Tournée" | "En Maintenance" | "Hors Service";

export type Tier = {
  id: number;
  type: TierType;
  name: string; // For Client/Fournisseur/Transporteur/VehicleType
  address: string; // For Client/Fournisseur/Transporteur
  createdAt: string;
  createdBy: string;
  environnementId: string;
  
  // -- VEHICLE SPECIFIC FIELDS --
  immatriculation?: string; // For Vehicule
  capacitePalette?: number; // For Vehicule
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
    typeMaintenance: string; // "Réparation", "Contrôle Technique", "Vidange", ...
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
  quantity: number; // Quantité commandée/livrée/retournée
  quantityReceived?: number;
  quantityNonConforming?: number;
  returnReason?: ReturnReason;
  returnDecision?: ReturnDecision;
};

export type Document = {
  id: number;
  type: 'Bon de Commande Fournisseur' | 'Bon de Livraison Client' | 'Lettre de Voiture' | 'Retour Client';
  tierId: number;
  status: 'En préparation' | 'Validé' | 'Expédié' | 'Réceptionné' | 'Réceptionné avec anomalies' | 'En attente de traitement' | 'Traité';
  lines: DocumentLine[];
  createdAt: string;
  createdBy: string;
  transporterId?: number; // For CMR
  environnementId: string;
  receptionNotes?: string; // Réserves à la réception
  originalDocumentId?: number; // For returns
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
    canUseIaTools: boolean;
    canUseMessaging: boolean;
    canManageScenarios: boolean;
    // TMS Permissions to be added
    canManageFleet: boolean;
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
  password: string; // In a real app, this should be a hash
  profile: UserProfile;
  classId?: number;
  createdAt: string;
  roleId: string; // Link to a Role
}

export type Class = {
    id: number;
    name:string;
    teacherIds?: string[]; // username of the teacher
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

// --- SCENARIO ENGINE TYPES ---

export type TaskType = 
    | 'CREATE_TIERS_FOURNISSEUR'
    | 'CREATE_TIERS_CLIENT'
    | 'CREATE_TIERS_TRANSPORTEUR'
    | 'CREATE_BC'
    | 'RECEIVE_BC'
    | 'CREATE_BL'
    | 'PREPARE_BL'
    | 'SHIP_BL'
    | 'MANUAL_VALIDATION'; // For tasks that require teacher validation

export type ScenarioTaskTemplate = {
    taskOrder: number;
    description: string;
    roleId: string;
    taskType: TaskType;
    prerequisite?: number; // Refers to taskOrder
    details?: Record<string, any>; // e.g., { tierName: 'PneuExpress', articleId: '123', quantity: 20 }
};

export type ScenarioTemplate = {
    id: number;
    title: string;
    description: string;
    competences: string[];
    rolesRequis: string[];
    tasks: ScenarioTaskTemplate[];
    createdBy: string;
    environnementId: string;
};

export type ScenarioStatus = 'preparing' | 'running' | 'completed';

export type ActiveScenario = {
    id: number;
    templateId: number;
    classId: number;
    status: ScenarioStatus;
    createdAt: string;
    environnementId: string;
};

export type TaskStatus = 'blocked' | 'todo' | 'completed';

export type Task = {
    id: number;
    scenarioId: number;
    userId: string;
    description: string;
    status: TaskStatus;
    taskType: TaskType;
    taskOrder: number;
    prerequisiteTaskId?: number;
    details?: Record<string, any>;
    environnementId: string;
};
