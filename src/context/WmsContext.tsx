

"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import type { Article, Tier, Document, Movement, User, Class, Email, Role, Permissions, ScenarioTemplate, ActiveScenario, Task, Environment, Maintenance, DocumentLine, GrilleTarifaire } from '@/lib/types';
import { initialArticles } from '@/lib/articles-data';
import { faker } from '@faker-js/faker/locale/fr';

// --- ROLES & PERMISSIONS DEFINITION ---
const ROLES: Map<string, Role> = new Map();

ROLES.set('super_admin', {
    id: 'super_admin',
    name: "Superviseur (Admin)",
    description: "Accès total à l'application pour la configuration.",
    isStudentRole: false,
    permissions: {
        isSuperAdmin: true,
        canViewDashboard: true, canManageTiers: true, canViewTiers: true, canCreateBC: true, canReceiveBC: true,
        canCreateBL: true, canPrepareBL: true, canShipBL: true, canManageStock: true, canViewStock: true,
        canManageClasses: true, canUseIaTools: true, canUseMessaging: true, canManageScenarios: true,
        canManageStudents: true, canManageFleet: true, canManageQuotes: true,
    }
});

ROLES.set('professeur', {
    id: 'professeur',
    name: "Enseignant",
    description: "Gère les classes, les scénarios et supervise les élèves.",
    isStudentRole: false,
    permissions: {
        isSuperAdmin: false,
        canViewDashboard: true, canManageTiers: true, canViewTiers: true, canCreateBC: true, canReceiveBC: true,
        canCreateBL: true, canPrepareBL: true, canShipBL: true, canManageStock: true, canViewStock: true,
        canManageClasses: true, canUseIaTools: true, canUseMessaging: true, canManageScenarios: true,
        canManageStudents: true, canManageFleet: true, canManageQuotes: true,
    }
});

ROLES.set('equipe_reception', {
    id: 'equipe_reception',
    name: "Équipe Réception & Achat",
    description: "Gère les flux entrants (Fournisseurs, BC, Réceptions).",
    isStudentRole: true,
    permissions: {
        isSuperAdmin: false, canViewDashboard: true, canManageTiers: true, canViewTiers: true, canCreateBC: true,
        canReceiveBC: true, canCreateBL: false, canPrepareBL: false, canShipBL: false,
        canManageStock: true, canViewStock: true, canManageClasses: false, canUseIaTools: true, canUseMessaging: true,
        canManageScenarios: false, canManageStudents: false, canManageFleet: false, canManageQuotes: false,
    }
});

ROLES.set('equipe_preparation', {
    id: 'equipe_preparation',
    name: "Équipe Préparation & Expé",
    description: "Gère les flux sortants (Clients, BL, Expéditions).",
    isStudentRole: true,
    permissions: {
        isSuperAdmin: false, canViewDashboard: true, canManageTiers: true, canViewTiers: true, canCreateBC: false,
        canReceiveBC: false, canCreateBL: true, canPrepareBL: true, canShipBL: true,
        canManageStock: false, canViewStock: true, canManageClasses: false, canUseIaTools: true, canUseMessaging: true,
        canManageScenarios: false, canManageStudents: false, canManageFleet: false, canManageQuotes: false,
    }
});

ROLES.set('tms_affreteur', {
    id: 'tms_affreteur',
    name: "Affréteur (TMS)",
    description: "Gère la création des devis de transport.",
    isStudentRole: true,
    permissions: {
        isSuperAdmin: false, canViewDashboard: true, canManageTiers: true, canViewTiers: true, canCreateBC: false,
        canReceiveBC: false, canCreateBL: false, canPrepareBL: false, canShipBL: false,
        canManageStock: false, canViewStock: false, canManageClasses: false, canUseIaTools: true, canUseMessaging: true,
        canManageScenarios: false, canManageStudents: false, canManageFleet: false, canManageQuotes: false,
    }
});

ROLES.set('tms_exploitation', {
    id: 'tms_exploitation',
    name: "Agent d'exploitation (TMS)",
    description: "Gère la planification et le suivi des tournées.",
    isStudentRole: true,
permissions: {
        isSuperAdmin: false, canViewDashboard: true, canManageTiers: false, canViewTiers: true, canCreateBC: false,
        canReceiveBC: false, canCreateBL: false, canPrepareBL: false, canShipBL: false,
        canManageStock: false, canViewStock: false, canManageClasses: false, canUseIaTools: true, canUseMessaging: true,
        canManageScenarios: false, canManageStudents: false, canManageFleet: true, canManageQuotes: false,
    }
});


const ENVIRONMENTS: Map<string, Environment> = new Map();
ENVIRONMENTS.set('magasin_pedago', {
    id: 'magasin_pedago',
    name: 'Magasin Pédagogique (Réel)',
    type: 'WMS',
    description: 'Stock physique du lycée. Lié au réel.'
});
ENVIRONMENTS.set('entrepot_fictif_ecommerce', {
    id: 'entrepot_fictif_ecommerce',
    name: 'Entrepôt E-Commerce (Fictif)',
    type: 'WMS',
    description: 'Simulation à grande échelle.'
});
ENVIRONMENTS.set('agence_transport', {
    id: 'agence_transport',
    name: 'Agence de Transport (TMS)',
    type: 'TMS',
    description: 'Gestion des devis et des tournées.'
});

const GRILLES_TARIFAIRES: Map<string, GrilleTarifaire> = new Map();
GRILLES_TARIFAIRES.set('default_tms', {
    id: 'default_tms',
    name: 'Grille Standard 2024',
    tarifs: {
        base: 50, // Prix de base pour tout transport
        distance: [
            { palier: 100, prixKm: 2.5 }, // Jusqu'à 100km
            { palier: 500, prixKm: 2.2 }, // de 101km à 500km
            { palier: Infinity, prixKm: 2.0 }, // Au-delà de 500km
        ],
        poids: [
            { palier: 1000, supplement: 0 }, // Jusqu'à 1000kg
            { palier: 5000, supplement: 75 }, // de 1001kg à 5000kg
            { palier: Infinity, supplement: 150 }, // Au-delà de 5000kg
        ]
    }
})


interface WmsState {
  articles: Map<string, Article>;
  tiers: Map<number, Tier>;
  documents: Map<number, Document>;
  movements: Movement[];
  users: Map<string, User>;
  classes: Map<number, Class>;
  emails: Map<number, Email>;
  roles: Map<string, Role>;
  environments: Map<string, Environment>;
  maintenances: Map<number, Maintenance>;
  grillesTarifaires: Map<string, GrilleTarifaire>;
  scenarioTemplates: Map<number, ScenarioTemplate>;
  activeScenarios: Map<number, ActiveScenario>;
  tasks: Map<number, Task>;
  tierIdCounter: number;
  docIdCounter: number;
  movementIdCounter: number;
  classIdCounter: number;
  emailIdCounter: number;
  maintenanceIdCounter: number;
  scenarioTemplateIdCounter: number;
  activeScenarioIdCounter: number;
  taskIdCounter: number;
  currentUser: User | null;
  currentUserPermissions: Permissions | null;
  currentEnvironmentId: string;
}

const getInitialState = (): WmsState => {
  const defaultEnvId = 'magasin_pedago';
  const articlesWithEnv = initialArticles.map(a => [a.id, {...a, environnementId: defaultEnvId}]) as [string, Article][];
  const articlesMap = new Map(articlesWithEnv);
  
  const initialMovements: Movement[] = Array.from(articlesMap.values()).filter(a => a.environnementId === defaultEnvId).map((article, index) => ({
    id: index + 1,
    timestamp: new Date().toISOString(),
    articleId: article.id,
    type: 'Initial',
    quantity: article.stock,
    stockAfter: article.stock,
    user: 'Système',
    environnementId: defaultEnvId,
  }));

  const initialUsers = new Map<string, User>();
  initialUsers.set('admin', { username: 'admin', password: 'admin', profile: 'Administrateur', createdAt: new Date().toISOString(), roleId: 'super_admin' });
  initialUsers.set('prof', { username: 'prof', password: 'prof', profile: 'professeur', createdAt: new Date().toISOString(), roleId: 'professeur' });
  
  const demoClassId = 1;
  const initialClasses = new Map<number, Class>();
  initialClasses.set(demoClassId, { id: demoClassId, name: 'Classe Démo', teacherIds: ['prof']});
  initialUsers.set('eleve1', { username: 'eleve1', password: 'eleve', profile: 'élève', createdAt: new Date().toISOString(), roleId: 'equipe_reception', classId: demoClassId });
  initialUsers.set('eleve2', { username: 'eleve2', password: 'eleve2', profile: 'élève', createdAt: new Date().toISOString(), roleId: 'equipe_preparation', classId: demoClassId });
  initialUsers.set('affreteur', { username: 'affreteur', password: 'affreteur', profile: 'élève', createdAt: new Date().toISOString(), roleId: 'tms_affreteur', classId: demoClassId });

  const initialScenarioTemplates = new Map<number, ScenarioTemplate>();
  let templateIdCounter = 1;

  initialScenarioTemplates.set(templateIdCounter++, {
    id: 1,
    title: "Flux Logistique Complet (WMS)",
    description: "Un scénario complet qui couvre la création des tiers, la réception de marchandises et l'expédition d'une commande client.",
    competences: ["Création Tiers", "Réception", "Expédition"],
    rolesRequis: ["equipe_reception", "equipe_preparation"],
    tasks: [
        { taskOrder: 1, description: "Créez un nouveau fournisseur pour des pièces automobiles.", roleId: "equipe_reception", taskType: "CREATE_TIERS_FOURNISSEUR", environnementId: 'magasin_pedago' },
        { taskOrder: 2, description: "Passez un Bon de Commande (BC) chez le fournisseur que vous venez de créer pour 5 unités de l'article '23371'.", roleId: "equipe_reception", taskType: "CREATE_BC", prerequisiteTaskId: 1, environnementId: 'magasin_pedago' },
        { taskOrder: 3, description: "Réceptionnez la marchandise du Bon de Commande. Déclarez 4 unités reçues conformes et 1 non-conforme.", roleId: "equipe_reception", taskType: "RECEIVE_BC", prerequisiteTaskId: 2, environnementId: 'magasin_pedago' },
        { taskOrder: 4, description: "Créez un nouveau client pour le garage 'Auto-Répar'.", roleId: "equipe_preparation", taskType: "CREATE_TIERS_CLIENT", environnementId: 'magasin_pedago'},
        { taskOrder: 5, description: "Créez un Bon de Livraison (BL) pour le client 'Auto-Répar' avec 3 unités de l'article '23371'.", roleId: "equipe_preparation", taskType: "CREATE_BL", prerequisiteTaskId: 4, environnementId: 'magasin_pedago' },
        { taskOrder: 6, description: "Préparez la commande du BL que vous venez de créer.", roleId: "equipe_preparation", taskType: "PREPARE_BL", prerequisiteTaskId: 5, environnementId: 'magasin_pedago' },
        { taskOrder: 7, description: "Expédiez la commande et générez les documents finaux.", roleId: "equipe_preparation", taskType: "SHIP_BL", prerequisiteTaskId: 6, environnementId: 'magasin_pedago' },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago',
  });
  
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 2,
    title: "Réception avec Litige Fournisseur",
    description: "Un fournisseur livre une commande avec des quantités incorrectes et des articles endommagés. L'élève doit identifier et gérer les anomalies.",
    competences: ["Réception", "Gestion des litiges", "Communication"],
    rolesRequis: ["equipe_reception"],
    tasks: [
      { taskOrder: 1, description: "Un Bon de Commande (N°1) pour 10 'AMPOULE PHILIPS' est déjà créé. Allez dans 'Flux Entrant' pour le réceptionner.", roleId: "equipe_reception", taskType: "MANUAL_VALIDATION", environnementId: 'magasin_pedago' },
      { taskOrder: 2, description: "Lors de la réception, déclarez seulement 8 articles reçus et 2 comme 'non-conformes'. Ajoutez une note sur le bon de livraison.", roleId: "equipe_reception", taskType: "RECEIVE_BC", prerequisiteTaskId: 1, environnementId: 'magasin_pedago' },
      { taskOrder: 3, description: "Utilisez la messagerie pour envoyer un e-mail au fournisseur (fictif) pour l'informer du litige.", roleId: "equipe_reception", taskType: "MANUAL_VALIDATION", prerequisiteTaskId: 2, environnementId: 'magasin_pedago' },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago'
  });

  initialScenarioTemplates.set(templateIdCounter++, {
    id: 3,
    title: "Inventaire Tournant Urgent",
    description: "Suite à une alerte, un inventaire doit être réalisé sur une allée spécifique pour corriger un écart de stock majeur.",
    competences: ["Inventaire", "Analyse d'écarts", "Correction de stock"],
    rolesRequis: ["equipe_reception"],
    tasks: [
      { taskOrder: 1, description: "Une alerte de stock négatif a été signalée sur l'article 'COLLIER SERFLEX'. Allez dans 'Gestion des Stocks > Inventaire'.", roleId: "equipe_reception", taskType: "MANUAL_VALIDATION", environnementId: 'magasin_pedago' },
      { taskOrder: 2, description: "Comptez physiquement l'article 'COLLIER SERFLEX' et ajustez le stock à la quantité réelle de 5 unités.", roleId: "equipe_reception", taskType: "MANUAL_VALIDATION", prerequisiteTaskId: 1, environnementId: 'magasin_pedago' },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago'
  });
  
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 4,
    title: "Préparation de Commande Express",
    description: "Un client VIP passe une commande urgente. L'élève doit créer le BL, optimiser le picking et expédier la commande en priorité.",
    competences: ["Préparation de commande", "Optimisation de picking", "Gestion des priorités"],
    rolesRequis: ["equipe_preparation"],
    tasks: [
      { taskOrder: 1, description: "Créez un client 'Client Express'.", roleId: "equipe_preparation", taskType: "CREATE_TIERS_CLIENT", environnementId: 'magasin_pedago' },
      { taskOrder: 2, description: "Créez un BL pour 'Client Express' avec les articles '67712' (2 unités) et 'A460' (3 unités).", roleId: "equipe_preparation", taskType: "CREATE_BL", prerequisiteTaskId: 1, environnementId: 'magasin_pedago' },
      { taskOrder: 3, description: "Générez le bon de préparation optimisé pour ce BL.", roleId: "equipe_preparation", taskType: "PREPARE_BL", prerequisiteTaskId: 2, environnementId: 'magasin_pedago' },
      { taskOrder: 4, description: "Expédiez la commande.", roleId: "equipe_preparation", taskType: "SHIP_BL", prerequisiteTaskId: 3, environnementId: 'magasin_pedago' },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago'
  });

  initialScenarioTemplates.set(templateIdCounter++, {
    id: 5,
    title: "Gestion d'un Retour Client",
    description: "Un client retourne un article défectueux. L'élève doit enregistrer le retour, inspecter l'article et décider de sa réintégration ou de sa mise au rebut.",
    competences: ["Gestion des retours", "Contrôle qualité"],
    rolesRequis: ["equipe_reception"],
    tasks: [
        { taskOrder: 1, description: "Un client rapporte un 'FEU ARRIERE' (ID 2070649). Allez dans 'Flux Entrant > Gérer un Retour Client' pour l'enregistrer.", roleId: "equipe_reception", taskType: "MANUAL_VALIDATION", environnementId: 'magasin_pedago' },
        { taskOrder: 2, description: "Traitez le retour : décidez de 'Mettre au rebut' l'article car il est cassé.", roleId: "equipe_reception", taskType: "MANUAL_VALIDATION", prerequisiteTaskId: 1, environnementId: 'magasin_pedago' },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago'
  });
  
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 6,
    title: "Création d'un Devis de Transport (TMS)",
    description: "Un client demande un devis pour un transport. L'élève doit utiliser l'environnement TMS pour créer un devis basé sur la grille tarifaire.",
    competences: ["Chiffrage transport", "Relation client"],
    rolesRequis: ["tms_affreteur"],
    tasks: [
        { taskOrder: 1, description: "Basculez sur l'environnement 'Agence de Transport (TMS)'.", roleId: "tms_affreteur", taskType: "MANUAL_VALIDATION", environnementId: 'agence_transport' },
        { taskOrder: 2, description: "Créez un nouveau client pour cette demande de devis.", roleId: "tms_affreteur", taskType: "CREATE_TIERS_CLIENT", prerequisiteTaskId: 1, environnementId: 'agence_transport' },
        { taskOrder: 3, description: "Créez un devis pour ce client pour un trajet de 150km avec un poids de 800kg.", roleId: "tms_affreteur", taskType: "MANUAL_VALIDATION", prerequisiteTaskId: 2, environnementId: 'agence_transport' },
    ],
    createdBy: 'admin',
    environnementId: 'agence_transport'
  });
  
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 7,
    title: "Gestion de la Flotte de Véhicules (TMS)",
    description: "Un véhicule nécessite une maintenance. L'élève doit l'enregistrer, le mettre en maintenance, puis le remettre en service.",
    competences: ["Gestion de flotte", "Maintenance"],
    rolesRequis: ["tms_exploitation"],
    tasks: [
        { taskOrder: 1, description: "Basculez sur l'environnement 'Agence de Transport (TMS)'.", roleId: "tms_exploitation", taskType: "MANUAL_VALIDATION", environnementId: 'agence_transport' },
        { taskOrder: 2, description: "Ajoutez un nouveau véhicule 'Camion 20m³' à la flotte.", roleId: "tms_exploitation", taskType: "CREATE_TIERS_TRANSPORTEUR", prerequisiteTaskId: 1, environnementId: 'agence_transport' },
        { taskOrder: 3, description: "Le nouveau camion a un pneu crevé. Mettez-le en maintenance pour 'Réparation pneu'.", roleId: "tms_exploitation", taskType: "MANUAL_VALIDATION", prerequisiteTaskId: 2, environnementId: 'agence_transport' },
        { taskOrder: 4, description: "La réparation est terminée. Clôturez l'intervention de maintenance pour rendre le véhicule de nouveau disponible.", roleId: "tms_exploitation", taskType: "MANUAL_VALIDATION", prerequisiteTaskId: 3, environnementId: 'agence_transport' },
    ],
    createdBy: 'admin',
    environnementId: 'agence_transport'
  });

  return {
    articles: articlesMap,
    tiers: new Map(),
    documents: new Map(),
    movements: initialMovements,
    users: initialUsers,
    classes: initialClasses,
    emails: new Map(),
    roles: ROLES,
    environments: ENVIRONMENTS,
    maintenances: new Map(),
    grillesTarifaires: GRILLES_TARIFAIRES,
    scenarioTemplates: initialScenarioTemplates,
    activeScenarios: new Map(),
    tasks: new Map(),
    tierIdCounter: 1,
    docIdCounter: 1,
    movementIdCounter: initialMovements.length + 1,
    classIdCounter: 2,
    emailIdCounter: 1,
    maintenanceIdCounter: 1,
    scenarioTemplateIdCounter: templateIdCounter,
    activeScenarioIdCounter: 1,
    taskIdCounter: 1,
    currentUser: null,
    currentUserPermissions: null,
    currentEnvironmentId: defaultEnvId,
  };
};

type WmsAction =
  | { type: 'ADD_ARTICLE', payload: Omit<Article, 'environnementId' | 'status'> }
  | { type: 'ADD_TIER'; payload: Omit<Tier, 'id' | 'createdAt' | 'createdBy' | 'environnementId'> }
  | { type: 'CREATE_DOCUMENT'; payload: Omit<Document, 'id' | 'createdAt' | 'createdBy' | 'environnementId'> }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'ADJUST_INVENTORY'; payload: { articleId: string; newStock: number; oldStock: number } }
  | { type: 'LOGIN'; payload: { username: string, password: string} }
  | { type: 'REAUTHENTICATE_USER'; payload: { username: string } }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_USER', payload: Omit<User, 'password' | 'createdAt'> & { password?: string, classId?: number } }
  | { type: 'ADD_CLASS', payload: { name: string } }
  | { type: 'DELETE_CLASS', payload: { classId: number } }
  | { type: 'TOGGLE_TEACHER_CLASS_ASSIGNMENT', payload: { classId: number, teacherId: string } }
  | { type: 'SEND_EMAIL'; payload: Omit<Email, 'id' | 'timestamp' | 'isRead'> }
  | { type: 'MARK_EMAIL_AS_READ'; payload: { emailId: number } }
  | { type: 'SAVE_SCENARIO_TEMPLATE'; payload: Omit<ScenarioTemplate, 'id' | 'createdBy' | 'environnementId'> & { id?: number } }
  | { type: 'DELETE_SCENARIO_TEMPLATE'; payload: { templateId: number } }
  | { type: 'LAUNCH_SCENARIO', payload: { templateId: number, classId: number } }
  | { type: 'GENERATE_ARTICLES_BATCH'; payload: { articles: Omit<Article, 'environnementId' | 'status'>[] } }
  | { type: 'RESET_ARTICLES'; payload: { environnementId: string } }
  | { type: 'START_MAINTENANCE'; payload: { vehiculeId: number, notes: string } }
  | { type: 'FINISH_MAINTENANCE'; payload: { maintenanceId: number } }
  | { type: 'UPDATE_STUDENT_ROLE', payload: { username: string, newRoleId: string } }
  | { type: 'DELETE_USER', payload: { username: string } }
  | { type: 'RESET_USER_PASSWORD', payload: { username: string, newPassword: string } }
  | { type: 'SET_STATE'; payload: WmsState }
  | { type: 'SET_ENVIRONMENT'; payload: { environmentId: string } };

const validateAndUpdateTasks = (state: WmsState, action: WmsAction): WmsState => {
    const { currentUser, tasks, activeScenarios, currentEnvironmentId } = state;
    if (!currentUser) return state;

    const userActiveScenario = Array.from(activeScenarios.values()).find(sc => sc.classId === currentUser.classId && sc.status === 'running');
    if (!userActiveScenario) return state;

    // A task can only be completed in its designated environment.
    const userTasks = Array.from(tasks.values()).filter(t => t.userId === currentUser.username && t.scenarioId === userActiveScenario.id && t.environnementId === currentEnvironmentId);
    const todoTasks = userTasks.filter(t => t.status === 'todo');

    let completedTaskId: number | null = null;

    for (const task of todoTasks) {
        let taskCompleted = false;
        switch (task.taskType) {
            case 'CREATE_TIERS_CLIENT':
                if (action.type === 'ADD_TIER' && action.payload.type === 'Client' && action.payload.environnementId === currentEnvironmentId) taskCompleted = true;
                break;
            case 'CREATE_TIERS_FOURNISSEUR':
                if (action.type === 'ADD_TIER' && action.payload.type === 'Fournisseur' && action.payload.environnementId === currentEnvironmentId) taskCompleted = true;
                break;
            case 'CREATE_TIERS_TRANSPORTEUR':
                if (action.type === 'ADD_TIER' && action.payload.type === 'Transporteur' && action.payload.environnementId === currentEnvironmentId) taskCompleted = true;
                break;
            case 'CREATE_BC':
                if (action.type === 'CREATE_DOCUMENT' && action.payload.type === 'Bon de Commande Fournisseur' && action.payload.environnementId === currentEnvironmentId) taskCompleted = true;
                break;
            case 'RECEIVE_BC':
                 if (action.type === 'UPDATE_DOCUMENT' && action.payload.type === 'Bon de Commande Fournisseur' && action.payload.status.startsWith('Réceptionné') && action.payload.environnementId === currentEnvironmentId) taskCompleted = true;
                break;
            case 'CREATE_BL':
                 if (action.type === 'CREATE_DOCUMENT' && action.payload.type === 'Bon de Livraison Client' && action.payload.environnementId === currentEnvironmentId) taskCompleted = true;
                break;
            case 'PREPARE_BL': // This is a virtual step for now, linked to SHIP_BL
            case 'SHIP_BL':
                if (action.type === 'UPDATE_DOCUMENT' && action.payload.type === 'Bon de Livraison Client' && action.payload.status === 'Expédié' && action.payload.environnementId === currentEnvironmentId) taskCompleted = true;
                break;
        }
        if (taskCompleted) {
            completedTaskId = task.id;
            break; 
        }
    }

    if (completedTaskId) {
        const newTasks = new Map(tasks);
        const completedTask = newTasks.get(completedTaskId);
        if (completedTask) {
            newTasks.set(completedTaskId, { ...completedTask, status: 'completed' });

            // Unlock next tasks for all users in the scenario, not just the current user
            newTasks.forEach(task => {
                if (task.prerequisiteTaskId === completedTaskId) {
                    const taskToUnlock = newTasks.get(task.id);
                    if (taskToUnlock) {
                        newTasks.set(task.id, { ...taskToUnlock, status: 'todo' });
                    }
                }
            });
            return { ...state, tasks: newTasks };
        }
    }
    
    return state;
};


const wmsReducer = (state: WmsState, action: WmsAction): WmsState => {
  let newState: WmsState;
  switch (action.type) {
    case 'LOGIN': {
      const { username, password } = action.payload;
      const user = state.users.get(username);
      if (user && user.password === password) {
        const permissions = state.roles.get(user.roleId)?.permissions || null;
        newState = { ...state, currentUser: user, currentUserPermissions: permissions };
      } else {
        newState = state; // Do not throw, just return current state
      }
      break;
    }
     case 'REAUTHENTICATE_USER': {
      const { username } = action.payload;
      const user = state.users.get(username);
      if (user) {
        const permissions = state.roles.get(user.roleId)?.permissions || null;
        newState = { ...state, currentUser: user, currentUserPermissions: permissions };
      } else {
        // User from localStorage not found, just return current state
        newState = state;
      }
      break;
    }
    case 'LOGOUT':
      localStorage.removeItem('wmsLastUser');
      localStorage.removeItem('wmsLastEnv');
      newState = { 
        ...getInitialState(), 
        users: state.users,
        classes: state.classes,
        scenarioTemplates: state.scenarioTemplates, // Keep templates
      };
      break;
    case 'REGISTER_USER': {
        const { username, password, profile, classId, roleId } = action.payload;
        if (state.users.has(username)) {
            throw new Error("Cet identifiant existe déjà.");
        }
        if (!password) {
            throw new Error("Le mot de passe est requis.");
        }
        
        let finalRoleId = roleId;
        if (profile === 'professeur') {
            finalRoleId = 'professeur';
        } else if (profile === 'Administrateur') {
            finalRoleId = 'super_admin';
        }

        if (!finalRoleId) {
            throw new Error("Le rôle est requis.");
        }
        
        if (profile === 'élève' && (state.classes.size === 0 || !classId)) {
             throw new Error("Aucune classe n'a été créée. Inscription impossible.");
        }

        const newUsers = new Map(state.users);

        const newUser: User = { 
            username, 
            password, 
            profile, 
            createdAt: new Date().toISOString(),
            roleId: finalRoleId,
        };
        if (profile === 'élève' && classId) {
            newUser.classId = classId;
        }
        newUsers.set(username, newUser);
        newState = { ...state, users: newUsers };
        break;
    }
     case 'ADD_ARTICLE': {
      if (!state.currentUserPermissions?.canManageStock || !state.currentUser) return state;
      const { id, name, location, stock, price, packaging } = action.payload;
      if (state.articles.has(id)) {
        // In a real app, you'd probably want to throw an error here or show a toast.
        // For now, we'll just log it and not add the article.
        console.error(`Article with ID ${id} already exists.`);
        return state;
      }
      const newArticle: Article = {
        id,
        name,
        location,
        stock,
        price,
        packaging,
        status: 'Actif',
        environnementId: state.currentEnvironmentId,
      };
      const newArticles = new Map(state.articles);
      newArticles.set(id, newArticle);

      const newMovements = [...state.movements];
      let newMovementIdCounter = state.movementIdCounter;
      if (stock > 0) {
        newMovements.push({
            id: newMovementIdCounter++,
            timestamp: new Date().toISOString(),
            articleId: id,
            type: 'Initial',
            quantity: stock,
            stockAfter: stock,
            user: state.currentUser.username,
            environnementId: state.currentEnvironmentId,
        });
      }

      newState = { ...state, articles: newArticles, movements: newMovements, movementIdCounter: newMovementIdCounter };
      break;
    }
    case 'ADD_CLASS': {
        if (!state.currentUserPermissions?.canManageClasses) return state;
        const newClass: Class = {
            id: state.classIdCounter,
            name: action.payload.name,
            teacherIds: (state.currentUser?.profile === 'professeur') ? [state.currentUser.username] : []
        };
        const newClasses = new Map(state.classes);
        newClasses.set(newClass.id, newClass);
        newState = { ...state, classes: newClasses, classIdCounter: state.classIdCounter + 1 };
        break;
    }
    case 'DELETE_CLASS': {
        if (!state.currentUserPermissions?.isSuperAdmin) return state;
        const { classId } = action.payload;
        const newClasses = new Map(state.classes);
        newClasses.delete(classId);

        const newUsers = new Map(state.users);
        newUsers.forEach((user, username) => {
            if (user.classId === classId) {
                const updatedUser = { ...user };
                delete updatedUser.classId;
                newUsers.set(username, updatedUser);
            }
        });

        newState = { ...state, classes: newClasses, users: newUsers };
        break;
    }
    case 'TOGGLE_TEACHER_CLASS_ASSIGNMENT': {
        if (!state.currentUserPermissions?.canManageClasses) return state;
        const { classId, teacherId } = action.payload;
        const newClasses = new Map(state.classes);
        const classToUpdate = newClasses.get(classId);

        if (classToUpdate) {
            const teacherIds = classToUpdate.teacherIds || [];
            const isAssigned = teacherIds.includes(teacherId);

            if (isAssigned) {
                const newTeacherIds = teacherIds.filter(id => id !== teacherId);
                newClasses.set(classId, { ...classToUpdate, teacherIds: newTeacherIds });
            } else {
                const newTeacherIds = [...teacherIds, teacherId];
                newClasses.set(classId, { ...classToUpdate, teacherIds: newTeacherIds });
            }
            newState = { ...state, classes: newClasses };
        } else {
          newState = state;
        }
        break;
    }
    case 'SEND_EMAIL': {
      if (!state.currentUser || !state.currentUserPermissions?.canUseMessaging) return state;
    
      const newEmailData = action.payload;
      const newEmails = new Map(state.emails);
      let emailIdCounter = state.emailIdCounter;
    
      const sentEmail: Email = {
        ...newEmailData,
        id: emailIdCounter++,
        timestamp: new Date().toISOString(),
        isRead: true, 
      };
      newEmails.set(sentEmail.id, sentEmail);
    
      const isRecipientTier = newEmailData.recipient.startsWith('tier-');
    
      if (isRecipientTier && state.currentUser.profile === 'élève') {
        const tierId = parseInt(newEmailData.recipient.split('-')[1]);
        const tier = state.tiers.get(tierId);
        const studentClass = state.currentUser.classId ? state.classes.get(state.currentUser.classId) : undefined;
        
        if (studentClass?.teacherIds && tier) {
          studentClass.teacherIds.forEach(teacherId => {
            const teacherEmail: Email = {
              ...newEmailData,
              id: emailIdCounter++,
              recipient: teacherId,
              subject: `[Pour correction - E-mail à ${tier.name}] ${newEmailData.subject}`,
              timestamp: new Date().toISOString(),
              isRead: false,
            };
            newEmails.set(teacherEmail.id, teacherEmail);
          });
        }
      } else {
        const inboxEmail: Email = {
          ...newEmailData,
          id: emailIdCounter++,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        newEmails.set(inboxEmail.id, inboxEmail);
    
        const recipientUser = state.users.get(newEmailData.recipient);
        if (state.currentUser.profile === 'élève' && recipientUser?.profile === 'élève') {
          const studentClass = state.currentUser.classId ? state.classes.get(state.currentUser.classId) : undefined;
          if (studentClass?.teacherIds) {
            studentClass.teacherIds.forEach(teacherId => {
              if (newEmailData.recipient !== teacherId && newEmailData.sender !== teacherId) {
                const ccEmail: Email = {
                  ...newEmailData,
                  id: emailIdCounter++,
                  recipient: teacherId,
                  subject: `[Copie de ${newEmailData.sender}] ${newEmailData.subject}`,
                  timestamp: new Date().toISOString(),
                  isRead: false,
                };
                newEmails.set(ccEmail.id, ccEmail);
              }
            });
          }
        }
      }
      
      newState = { ...state, emails: newEmails, emailIdCounter };
      break;
    }
    case 'MARK_EMAIL_AS_READ': {
      if (!state.currentUserPermissions?.canUseMessaging) return state;
      const newEmails = new Map(state.emails);
      const email = newEmails.get(action.payload.emailId);
      if (email) {
        newEmails.set(action.payload.emailId, { ...email, isRead: true });
        newState = { ...state, emails: newEmails };
      } else {
        newState = state;
      }
      break;
    }
    case 'ADD_TIER': {
      if (!state.currentUserPermissions?.canManageTiers || !state.currentUser) return state;
      const newTier: Tier = { 
        ...action.payload, 
        id: state.tierIdCounter,
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser.username,
        environnementId: state.currentEnvironmentId,
        name: action.payload.type === 'Vehicule' ? action.payload.name : action.payload.name,
      };
       if (newTier.type === 'Vehicule') {
          newTier.status = 'Disponible';
          newTier.name = action.payload.name || newTier.immatriculation || '';
      }
      const newTiers = new Map(state.tiers);
      newTiers.set(newTier.id, newTier);
      newState = { ...state, tiers: newTiers, tierIdCounter: state.tierIdCounter + 1 };
      break;
    }
    case 'CREATE_DOCUMENT': {
        const { type } = action.payload;
        const perms = state.currentUserPermissions;
        if (!state.currentUser || (type === 'Bon de Commande Fournisseur' && !perms?.canCreateBC) || (type === 'Bon de Livraison Client' && !perms?.canCreateBL) || (type === 'Lettre de Voiture' && !perms?.canShipBL) || (type === 'Retour Client' && !perms?.canReceiveBC) || (type === 'Devis Transport' && !perms?.canManageQuotes) ) {
            return state;
        }
        const newDoc: Document = { 
            ...action.payload, 
            id: state.docIdCounter, 
            createdAt: new Date().toISOString(),
            createdBy: state.currentUser.username,
            environnementId: state.currentEnvironmentId,
        };
        const newDocuments = new Map(state.documents);
        newDocuments.set(newDoc.id, newDoc);
        newState = { ...state, documents: newDocuments, docIdCounter: state.docIdCounter + 1 };
        break;
    }
    case 'UPDATE_DOCUMENT': {
        const updatedDocuments = new Map(state.documents);
        const docToUpdate = action.payload;
        const currentUser = state.currentUser;

        if (!currentUser) return state;

        const oldDoc = state.documents.get(docToUpdate.id);
        if(!oldDoc) return state;

        const newArticles = new Map(state.articles);
        const newMovements = [...state.movements];
        let newMovementIdCounter = state.movementIdCounter;
        
        // --- LOGIC FOR CUSTOMER RETURNS ---
        if (oldDoc.type === 'Retour Client' && oldDoc.status !== 'Traité' && docToUpdate.status === 'Traité') {
            if (!state.currentUserPermissions?.canReceiveBC) return state;

            docToUpdate.lines.forEach((line: DocumentLine) => {
                const article = newArticles.get(line.articleId);
                if (!article) return;

                if (line.returnDecision === 'Réintégrer en stock') {
                    const newStock = article.stock + line.quantity;
                    newArticles.set(line.articleId, { ...article, stock: newStock, status: 'Actif' });
                    newMovements.push({
                        id: newMovementIdCounter++,
                        timestamp: new Date().toISOString(),
                        articleId: line.articleId,
                        type: 'Retour Client',
                        quantity: line.quantity,
                        stockAfter: newStock,
                        user: currentUser.username,
                        environnementId: state.currentEnvironmentId,
                    });
                } else if (line.returnDecision === 'Mettre au rebut') {
                    // Stock doesn't change, just log the event. Real-world might move to a different stock type.
                    newMovements.push({
                        id: newMovementIdCounter++,
                        timestamp: new Date().toISOString(),
                        articleId: line.articleId,
                        type: 'Retour Client',
                        quantity: 0, // No change in quantity
                        stockAfter: article.stock,
                        user: currentUser.username,
                        environnementId: state.currentEnvironmentId,
                    });
                }
            });
        }


        if (oldDoc.type === 'Bon de Commande Fournisseur' && docToUpdate.status.startsWith('Réceptionné') && !oldDoc.status.startsWith('Réceptionné')) {
            if (!state.currentUserPermissions?.canReceiveBC) return state;
            
            docToUpdate.lines.forEach(line => {
                const article = newArticles.get(line.articleId);
                const quantityConforming = line.quantityReceived || 0;
                const quantityNonConforming = line.quantityNonConforming || 0;

                if (article) {
                    // Update stock with conforming quantity
                    const newStock = article.stock + quantityConforming;
                    newArticles.set(line.articleId, { ...article, stock: newStock });
                    newMovements.push({
                        id: newMovementIdCounter++,
                        timestamp: new Date().toISOString(),
                        articleId: line.articleId,
                        type: 'Entrée (Réception BC)',
                        quantity: quantityConforming,
                        stockAfter: newStock,
                        user: currentUser.username,
                        environnementId: state.currentEnvironmentId,
                    });

                    // Handle non-conforming items
                    if (quantityNonConforming > 0) {
                        const updatedArticle = newArticles.get(line.articleId);
                        if (updatedArticle) {
                            newArticles.set(line.articleId, { ...updatedArticle, status: 'En contrôle qualité' });
                             newMovements.push({
                                id: newMovementIdCounter++,
                                timestamp: new Date().toISOString(),
                                articleId: line.articleId,
                                type: 'Mise en non-conforme',
                                quantity: quantityNonConforming,
                                stockAfter: updatedArticle.stock, // Stock isn't changing here, just status
                                user: currentUser.username,
                                environnementId: state.currentEnvironmentId,
                            });
                        }
                    }
                }
            });
        }

        if (oldDoc.type === 'Bon de Livraison Client' && oldDoc.status !== 'Expédié' && docToUpdate.status === 'Expédié') {
             if (!state.currentUserPermissions?.canShipBL) return state;
            docToUpdate.lines.forEach(line => {
                const article = newArticles.get(line.articleId);
                if (article) {
                    const newStock = article.stock - line.quantity;
                    newArticles.set(line.articleId, { ...article, stock: newStock });
                    newMovements.push({
                        id: newMovementIdCounter++,
                        timestamp: new Date().toISOString(),
                        articleId: line.articleId,
                        type: 'Sortie (Expédition BL)',
                        quantity: -line.quantity,
                        stockAfter: newStock,
                        user: currentUser.username,
                        environnementId: state.currentEnvironmentId,
                    });
                }
            });
        }
        
        updatedDocuments.set(docToUpdate.id, docToUpdate);

        newState = { ...state, documents: updatedDocuments, articles: newArticles, movements: newMovements, movementIdCounter: newMovementIdCounter };
        break;
    }
    case 'ADJUST_INVENTORY': {
      if (!state.currentUserPermissions?.canManageStock || !state.currentUser) return state;
      const { articleId, newStock, oldStock } = action.payload;
      const newArticles = new Map(state.articles);
      const article = newArticles.get(articleId);

      if (article) {
        newArticles.set(articleId, { ...article, stock: newStock });
        const newMovement: Movement = {
          id: state.movementIdCounter,
          timestamp: new Date().toISOString(),
          articleId: articleId,
          type: 'Ajustement Inventaire',
          quantity: newStock - oldStock,
          stockAfter: newStock,
          user: state.currentUser.username,
          environnementId: state.currentEnvironmentId,
        };
        newState = {
          ...state,
          articles: newArticles,
          movements: [...state.movements, newMovement],
          movementIdCounter: state.movementIdCounter + 1,
        };
      } else {
        newState = state;
      }
      break;
    }
    case 'SAVE_SCENARIO_TEMPLATE': {
        if (!state.currentUserPermissions?.canManageScenarios || !state.currentUser) return state;
        const newTemplates = new Map(state.scenarioTemplates);
        if (action.payload.id) { // Update existing
            const existing = newTemplates.get(action.payload.id);
            if(existing && (existing.createdBy === state.currentUser.username || state.currentUserPermissions.isSuperAdmin)) {
                newTemplates.set(action.payload.id, {...existing, ...action.payload, environnementId: state.currentEnvironmentId});
            }
        } else { // Create new
            const newId = state.scenarioTemplateIdCounter;
            const newTemplate: ScenarioTemplate = {
                ...action.payload,
                id: newId,
                createdBy: state.currentUser.username,
                environnementId: state.currentEnvironmentId,
            };
            newTemplates.set(newId, newTemplate);
            newState = {...state, scenarioTemplates: newTemplates, scenarioTemplateIdCounter: newId + 1};
            break;
        }
        newState = {...state, scenarioTemplates: newTemplates};
        break;
    }
    case 'DELETE_SCENARIO_TEMPLATE': {
        if (!state.currentUserPermissions?.canManageScenarios || !state.currentUser) return state;
        const newTemplates = new Map(state.scenarioTemplates);
        const template = newTemplates.get(action.payload.templateId);
        if (template && (state.currentUserPermissions.isSuperAdmin || template.createdBy === state.currentUser.username)) {
            newTemplates.delete(action.payload.templateId);
        }
        newState = {...state, scenarioTemplates: newTemplates};
        break;
    }
    case 'LAUNCH_SCENARIO': {
        if (!state.currentUserPermissions?.canManageScenarios) return state;
        const { templateId, classId } = action.payload;
        const template = state.scenarioTemplates.get(templateId);
        if (!template || !template.rolesRequis.length) return state;
    
        const newActiveScenarioId = state.activeScenarioIdCounter;
        const newActiveScenarios = new Map(state.activeScenarios);
        newActiveScenarios.set(newActiveScenarioId, {
            id: newActiveScenarioId,
            templateId,
            classId,
            status: 'running',
            createdAt: new Date().toISOString(),
            environnementId: template.environnementId,
        });
    
        const studentsInClass = Array.from(state.users.values()).filter(u => u.classId === classId && u.profile === 'élève');
        const rolesToAssign = template.rolesRequis;
        const newUsers = new Map(state.users);
        const newTasks = new Map(state.tasks);
        let taskIdCounter = state.taskIdCounter;
        let localCurrentUser = state.currentUser;
        let localCurrentUserPermissions = state.currentUserPermissions;
    
        studentsInClass.forEach((student, index) => {
            const roleId = rolesToAssign[index % rolesToAssign.length];
            const updatedUser = { ...student, roleId };
            newUsers.set(student.username, updatedUser);
    
            if (state.currentUser && state.currentUser.username === student.username) {
                localCurrentUser = updatedUser;
                localCurrentUserPermissions = state.roles.get(roleId)?.permissions || null;
            }
    
            template.tasks.forEach(taskTemplate => {
                if (taskTemplate.roleId === roleId) {
                    const newTaskId = taskIdCounter++;
                    newTasks.set(newTaskId, {
                        id: newTaskId,
                        scenarioId: newActiveScenarioId,
                        userId: student.username,
                        description: taskTemplate.description,
                        taskType: taskTemplate.taskType,
                        status: taskTemplate.prerequisiteTaskId ? 'blocked' : 'todo',
                        details: taskTemplate.details,
                        taskOrder: taskTemplate.taskOrder,
                        prerequisiteTaskId: taskTemplate.prerequisiteTaskId,
                        environnementId: taskTemplate.environnementId || template.environnementId,
                    });
                }
            });
        });
  
        newState = {
            ...state,
            activeScenarios: newActiveScenarios,
            users: newUsers,
            tasks: newTasks,
            activeScenarioIdCounter: newActiveScenarioId + 1,
            taskIdCounter,
            currentUser: localCurrentUser,
            currentUserPermissions: localCurrentUserPermissions
        };
        break;
    }
    case 'GENERATE_ARTICLES_BATCH': {
        if (!state.currentUserPermissions?.canManageStock || !state.currentUser) return state;
        const newArticlesMap = new Map(state.articles);
        const newMovements = [...state.movements];
        let newMovementIdCounter = state.movementIdCounter;

        action.payload.articles.forEach(articleData => {
            if (!newArticlesMap.has(articleData.id)) {
                const newArticle: Article = {
                    ...articleData,
                    status: 'Actif',
                    environnementId: state.currentEnvironmentId,
                };
                newArticlesMap.set(articleData.id, newArticle);

                if (newArticle.stock > 0) {
                    newMovements.push({
                        id: newMovementIdCounter++,
                        timestamp: new Date().toISOString(),
                        articleId: newArticle.id,
                        type: 'Génération',
                        quantity: newArticle.stock,
                        stockAfter: newArticle.stock,
                        user: state.currentUser!.username,
                        environnementId: state.currentEnvironmentId,
                    });
                }
            }
        });
        newState = {
            ...state,
            articles: newArticlesMap,
            movements: newMovements,
            movementIdCounter: newMovementIdCounter
        };
        break;
    }
    case 'RESET_ARTICLES': {
        if (!state.currentUserPermissions?.canManageStock) return state;
        const { environnementId } = action.payload;
        const newArticles = new Map(state.articles);
        const newMovements = state.movements.filter(m => m.environnementId !== environnementId);
        
        state.articles.forEach((article, key) => {
            if (article.environnementId === environnementId) {
                newArticles.delete(key);
            }
        });
        newState = { ...state, articles: newArticles, movements: newMovements };
        break;
    }
    case 'START_MAINTENANCE': {
        if (!state.currentUserPermissions?.canManageFleet) return state;
        const { vehiculeId, notes } = action.payload;
        const newTiers = new Map(state.tiers);
        const vehicle = newTiers.get(vehiculeId);
        if (!vehicle || vehicle.type !== 'Vehicule') return state;

        vehicle.status = 'En Maintenance';
        newTiers.set(vehiculeId, vehicle);

        const newMaintenances = new Map(state.maintenances);
        const newMaintenanceId = state.maintenanceIdCounter;
        const newMaintenance: Maintenance = {
            id: newMaintenanceId,
            environnementId: state.currentEnvironmentId,
            vehiculeId,
            vehiculeImmat: vehicle.immatriculation || '',
            typeMaintenance: 'Réparation',
            dateEcheance: new Date().toISOString(),
            status: 'En cours',
            notes,
        };
        newMaintenances.set(newMaintenanceId, newMaintenance);

        newState = {
            ...state,
            tiers: newTiers,
            maintenances: newMaintenances,
            maintenanceIdCounter: newMaintenanceId + 1,
        };
        break;
    }
     case 'FINISH_MAINTENANCE': {
        if (!state.currentUserPermissions?.canManageFleet) return state;
        const { maintenanceId } = action.payload;
        const newMaintenances = new Map(state.maintenances);
        const maintenance = newMaintenances.get(maintenanceId);
        if (!maintenance || maintenance.status !== 'En cours') return state;

        maintenance.status = 'Terminée';
        maintenance.dateRealisation = new Date().toISOString();
        newMaintenances.set(maintenanceId, maintenance);

        const newTiers = new Map(state.tiers);
        const vehicle = newTiers.get(maintenance.vehiculeId);
        if (vehicle && vehicle.type === 'Vehicule') {
            vehicle.status = 'Disponible';
            newTiers.set(maintenance.vehiculeId, vehicle);
        }
        
        newState = { ...state, tiers: newTiers, maintenances: newMaintenances };
        break;
    }
    case 'UPDATE_STUDENT_ROLE': {
        if (!state.currentUserPermissions?.canManageStudents) return state;
        const { username, newRoleId } = action.payload;
        const newUsers = new Map(state.users);
        const user = newUsers.get(username);
        if (user && user.profile === 'élève') {
            user.roleId = newRoleId;
            newUsers.set(username, user);
        }
        newState = { ...state, users: newUsers };
        break;
    }
    case 'DELETE_USER': {
        if (!state.currentUserPermissions?.canManageStudents) return state;
        const { username } = action.payload;
        const newUsers = new Map(state.users);
        newUsers.delete(username);
        // Also delete associated tasks
        const newTasks = new Map<number, Task>();
        state.tasks.forEach((task, id) => {
            if (task.userId !== username) {
                newTasks.set(id, task);
            }
        });
        newState = { ...state, users: newUsers, tasks: newTasks };
        break;
    }
    case 'RESET_USER_PASSWORD': {
        if (!state.currentUserPermissions?.canManageStudents) return state;
        const { username, newPassword } = action.payload;
        const newUsers = new Map(state.users);
        const user = newUsers.get(username);
        if (user) {
            user.password = newPassword;
            newUsers.set(username, user);
        }
        newState = { ...state, users: newUsers };
        break;
    }
    case 'SET_STATE': {
        const loadedState = action.payload;
        if(loadedState.currentUser) {
            loadedState.currentUserPermissions = loadedState.roles.get(loadedState.currentUser.roleId) ?.permissions || null;
        } else {
            loadedState.currentUserPermissions = null;
        }
        newState = loadedState;
        break;
    }
    case 'SET_ENVIRONMENT': {
        if (state.environments.has(action.payload.environmentId)) {
            newState = { ...state, currentEnvironmentId: action.payload.environmentId };
        } else {
            newState = state;
        }
        break;
    }
    default:
      return state;
  }
  return validateAndUpdateTasks(newState, action);
};

interface WmsContextType {
  state: WmsState;
  dispatch: React.Dispatch<WmsAction>;
  getArticle: (id: string) => Article | undefined;
  getTier: (id: number) => Tier | undefined;
  getDocument: (id: number) => Document | undefined;
  getClass: (id: number) => Class | undefined;
}

const WmsContext = createContext<WmsContextType | undefined>(undefined);

export const WmsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(wmsReducer, undefined, getInitialState);

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem('wmsState');
      const initialState = getInitialState();
      
      let finalState = initialState;

      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        
        const reviveMap = (arr: any) => arr ? new Map(arr) : new Map();

        finalState = {
            ...initialState,
            ...savedState,
            articles: reviveMap(savedState.articles),
            tiers: reviveMap(savedState.tiers),
            documents: reviveMap(savedState.documents),
            users: reviveMap(savedState.users),
            classes: reviveMap(savedState.classes),
            emails: reviveMap(savedState.emails),
            maintenances: reviveMap(savedState.maintenances),
            scenarioTemplates: new Map([...initialState.scenarioTemplates, ...reviveMap(savedState.scenarioTemplates)]),
            activeScenarios: reviveMap(savedState.activeScenarios),
            tasks: reviveMap(savedState.tasks),
            roles: ROLES, 
            environments: ENVIRONMENTS,
            grillesTarifaires: GRILLES_TARIFAIRES,
        };
      }
      
      const lastUser = localStorage.getItem('wmsLastUser');
      if (lastUser && finalState.users.has(lastUser)) {
         const user = finalState.users.get(lastUser);
         if (user) {
            finalState.currentUser = user;
            finalState.currentUserPermissions = finalState.roles.get(user.roleId)?.permissions || null;
         }
      }
      
      const lastEnv = localStorage.getItem('wmsLastEnv');
      if(lastEnv && finalState.environments.has(lastEnv)) {
          finalState.currentEnvironmentId = lastEnv;
      }

      dispatch({ type: 'SET_STATE', payload: finalState });

    } catch (e) {
      console.error("Could not load state from localStorage. Using initial state.", e);
      dispatch({ type: 'SET_STATE', payload: getInitialState() });
    }
  }, []);

  useEffect(() => {
    try {
      const serializeMap = (map: Map<any, any>) => Array.from(map.entries());

      const stateToSave = {
          ...state,
          articles: serializeMap(state.articles),
          tiers: serializeMap(state.tiers),
          documents: serializeMap(state.documents),
          users: serializeMap(state.users),
          classes: serializeMap(state.classes),
          emails: serializeMap(state.emails),
          maintenances: serializeMap(state.maintenances),
          scenarioTemplates: serializeMap(state.scenarioTemplates),
          activeScenarios: serializeMap(state.activeScenarios),
          tasks: serializeMap(state.tasks),
          roles: undefined, 
          environments: undefined,
          grillesTarifaires: undefined,
          currentUser: undefined, 
          currentUserPermissions: undefined,
      };
      localStorage.setItem('wmsState', JSON.stringify(stateToSave));

      if (state.currentUser) {
          localStorage.setItem('wmsLastUser', state.currentUser.username);
      } else {
          localStorage.removeItem('wmsLastUser');
      }

      if (state.currentEnvironmentId) {
        localStorage.setItem('wmsLastEnv', state.currentEnvironmentId);
      }

    } catch (e) {
      console.error("Could not save state to localStorage.", e);
    }
  }, [state]);


  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getArticle: (id: string) => state.articles.get(id),
    getTier: (id: number) => state.tiers.get(id),
    getDocument: (id: number) => state.documents.get(id),
    getClass: (id: number) => state.classes.get(id),
  }), [state]);

  return <WmsContext.Provider value={contextValue}>{children}</WmsContext.Provider>;
};

export const useWms = () => {
  const context = useContext(WmsContext);
  if (context === undefined) {
    throw new Error('useWms must be used within a WmsProvider');
  }
  return context;
};
