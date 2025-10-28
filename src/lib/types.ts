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
  createdAt: string;
  createdBy: string;
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
  createdBy: string;
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
};

export type ScenarioStatus = 'preparing' | 'running' | 'completed';

export type ActiveScenario = {
    id: number;
    templateId: number;
    classId: number;
    status: ScenarioStatus;
    createdAt: string;
};

export type TaskStatus = 'blocked' | 'todo' | 'completed';

export type Task = {
    id: number;
    scenarioId: number;
    userId: string;
    description: string;
    status: TaskStatus;
    taskType: TaskType;
    prerequisiteTaskId?: number;
    details?: Record<string, any>;
};
