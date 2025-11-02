

"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import type { Article, Tier, Document, Movement, User, Class, Email, Role, Permissions, ScenarioTemplate, ActiveScenario, Task, Environment, Maintenance, DocumentLine, GrilleTarifaire, TierType } from '@/lib/types';
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
        canManageStudents: true, canManageFleet: true, canManageQuotes: true, profile: "Administrateur"
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
        canManageStudents: true, canManageFleet: true, canManageQuotes: true, profile: "professeur"
    }
});

ROLES.set('chef_equipe', {
    id: 'chef_equipe',
    name: "Chef d'Équipe",
    description: "Supervise les opérations d'une équipe, a une vue d'ensemble.",
    isStudentRole: true,
    permissions: {
        isSuperAdmin: false, canViewDashboard: true, canManageTiers: true, canViewTiers: true, canCreateBC: true,
        canReceiveBC: true, canCreateBL: true, canPrepareBL: true, canShipBL: true,
        canManageStock: true, canViewStock: true, canManageClasses: false, canUseIaTools: true, canUseMessaging: true,
        canManageScenarios: false, canManageStudents: false, canManageFleet: false, canManageQuotes: false, profile: "élève"
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
        canManageScenarios: false, canManageStudents: false, canManageFleet: false, canManageQuotes: false, profile: "élève"
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
        canManageScenarios: false, canManageStudents: false, canManageFleet: false, canManageQuotes: false, profile: "élève"
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
        canManageScenarios: false, canManageStudents: false, canManageFleet: false, canManageQuotes: true, profile: "élève"
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
        canManageScenarios: false, canManageStudents: false, canManageFleet: true, canManageQuotes: false, profile: "élève"
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

export const getInitialState = (): WmsState => {
  const defaultEnvId = 'magasin_pedago';

  const articlesWithEnv = initialArticles.map(a => [a.id, {...a, environnementId: defaultEnvId, ean: faker.commerce.isbn().replace(/-/g, '') }]) as [string, Article][];
  const articlesMap = new Map(articlesWithEnv);
  
  const ecommerceArticles = Array.from({ length: 50 }, (_, i) => {
    const name = faker.commerce.productName();
    const id = `${name.substring(0,3).toUpperCase()}-${faker.string.numeric(4)}`;
    return [id, {
        id,
        name,
        location: `${faker.string.alpha(1).toUpperCase()}.${faker.number.int({min:1, max:5})}.${faker.number.int({min:1, max:10})}.${faker.string.alpha(1).toUpperCase()}`,
        stock: faker.number.int({ min: 10, max: 200 }),
        price: parseFloat(faker.commerce.price()),
        packaging: 'PIEC',
        status: 'Actif' as const,
        environnementId: 'entrepot_fictif_ecommerce',
        ean: faker.commerce.isbn().replace(/-/g, '')
    }] as [string, Article];
  });
  ecommerceArticles.forEach(([id, article]) => articlesMap.set(id, article));


  const initialMovements: Movement[] = Array.from(articlesMap.values()).map((article, index) => ({
    id: index + 1,
    timestamp: new Date().toISOString(),
    articleId: article.id,
    type: 'Initial',
    quantity: article.stock,
    stockAfter: article.stock,
    user: 'Système',
    environnementId: article.environnementId,
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

  const initialTiers = new Map<number, Tier>();
  initialTiers.set(1, {
    id: 1, type: 'Transporteur', name: 'Transporteur Test', address: '456 Avenue des Tests',
    createdAt: new Date().toISOString(), createdBy: 'admin', environnementId: 'agence_transport', email: 'contact@transport-test.com'
  });


  const initialEmails = new Map<number, Email>();
  let emailIdCounter = 1;
  const now = Date.now();
  // Prof to eleve1
  initialEmails.set(emailIdCounter++, {
    id: 1, sender: 'prof', recipient: 'eleve1', subject: 'Instructions pour le scénario',
    body: 'Bonjour, veuillez commencer par créer le fournisseur "Test Fournisseur".',
    timestamp: new Date(now - 1000 * 60 * 10).toISOString(), isRead: false,
  });
  // eleve1 to prof
  initialEmails.set(emailIdCounter++, {
    id: 2, sender: 'eleve1', recipient: 'prof', subject: 'Re: Instructions',
    body: 'Bonjour Professeur, bien reçu. Je m\'en occupe.',
    timestamp: new Date(now - 1000 * 60 * 8).toISOString(), isRead: false,
  });
  // eleve1 to eleve2
  initialEmails.set(emailIdCounter++, {
    id: 3, sender: 'eleve1', recipient: 'eleve2', subject: 'Info réception',
    body: 'Salut, je vais bientôt réceptionner une commande. Prépare-toi pour la mise en stock.',
    timestamp: new Date(now - 1000 * 60 * 5).toISOString(), isRead: false,
  });
  // admin to prof
  initialEmails.set(emailIdCounter++, {
    id: 4, sender: 'admin', recipient: 'prof', subject: 'Rappel réunion pédagogique',
    body: 'N\'oubliez pas notre réunion demain à 10h pour discuter des nouveaux scénarios.',
    timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(), isRead: true,
  });
  // affreteur to tier
  initialEmails.set(emailIdCounter++, {
    id: 5, sender: 'affreteur', recipient: 'tier-1', subject: 'Demande de cotation',
    body: 'Bonjour, pourriez-vous nous fournir un devis pour un transport Paris-Lille ?',
    timestamp: new Date(now - 1000 * 60 * 3).toISOString(), isRead: false,
  });


  const initialScenarioTemplates = new Map<number, ScenarioTemplate>();
  let templateIdCounter = 1;

  // --- WMS SCENARIOS (REAL) ---
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 1,
    title: "WMS-R01 : Flux de base",
    description: "Un scénario simple pour maîtriser la réception et l'expédition d'un produit.",
    competences: ["C1.6", "C3.2"],
    rolesRequis: ["equipe_reception", "equipe_preparation"],
    tasks: [
      { taskOrder: 1, roleId: "equipe_reception", taskType: 'ACTION', emailDetails: { sender: 'SystemLogiSim', subject: 'Nouvelle Tâche : Création Fournisseur', body: "Bonjour, \n\nPour commencer, veuillez créer un nouveau fournisseur 'Pièces Auto Express' pour notre catalogue.\n\nCordialement,\nLogiSim Hub" } },
      { taskOrder: 2, roleId: "equipe_reception", taskType: 'ACTION', prerequisiteTaskOrder: 1, emailDetails: { sender: 'Service Achats', subject: 'Demande : Commande Pièces', body: "Merci d'avoir ajouté notre fournisseur. Pouvez-vous passer une commande pour 10 unités de 'RECHANGE SOUFFLET' (ID: 23371) ?" } },
      { taskOrder: 3, roleId: "equipe_reception", taskType: 'ACTION', prerequisiteTaskOrder: 2, emailDetails: { sender: 'SystemLogiSim', subject: 'Notification : Marchandise prête', body: "La marchandise de votre BC pour 'Pièces Auto Express' est arrivée. Veuillez la réceptionner.\nRéceptionnez exactement 10 unités." } },
      { taskOrder: 4, roleId: "equipe_preparation", taskType: 'ACTION', prerequisiteTaskOrder: 3, emailDetails: { sender: 'Service Commercial', subject: 'Nouvelle Commande Client', body: "Bonjour, \n\nUn nouveau client, 'Garage Du Centre', a besoin de 8 'RECHANGE SOUFFLET' (ID: 23371). Merci de créer le client et le bon de livraison (BL) correspondant." } },
      { taskOrder: 5, roleId: "equipe_preparation", taskType: 'ACTION', prerequisiteTaskOrder: 4, emailDetails: { sender: 'SystemLogiSim', subject: 'Préparation Commande', body: "Le BL pour 'Garage Du Centre' est prêt. Générez le bon de préparation et préparez la commande." } },
      { taskOrder: 6, roleId: "equipe_preparation", taskType: 'ACTION', prerequisiteTaskOrder: 5, emailDetails: { sender: 'SystemLogiSim', subject: 'Expédition', body: "La commande pour 'Garage Du Centre' est prête. Veuillez l'expédier et générer les documents de transport." } },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago',
  });
  
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 2,
    title: "WMS-R02 : Gestion d'un litige à la réception",
    description: "Gérer une livraison fournisseur non-conforme et communiquer l'anomalie.",
    competences: ["C1.6", "C2.2"],
    rolesRequis: ["equipe_reception"],
    tasks: [
        { taskOrder: 1, roleId: "equipe_reception", taskType: 'ACTION', emailDetails: { sender: 'SystemLogiSim', subject: 'URGENT : Réception en attente', body: "Le Bon de Commande pour 12 'COLLIER DE SERRAGE' (ID: 185350) est arrivé.\n\nLors de la réception, veuillez déclarer que vous n'avez reçu que 10 unités et que 2 sont endommagées (non-conformes). N'oubliez pas de laisser une note sur le bon." } },
        { taskOrder: 2, roleId: "equipe_reception", taskType: 'ACTION', prerequisiteTaskOrder: 1, emailDetails: { sender: 'Responsable Logistique', subject: 'Action requise : Litige réception', body: "Suite à la réception non-conforme, merci d'utiliser la messagerie interne pour envoyer une réclamation au fournisseur (simulé)." } },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago'
  });

  initialScenarioTemplates.set(templateIdCounter++, {
    id: 3,
    title: "WMS-R03 : Gestion d'un retour client",
    description: "Traiter le retour d'un article défectueux envoyé par un client.",
    competences: ["C3.3"],
    rolesRequis: ["equipe_reception"],
    tasks: [
        { taskOrder: 1, roleId: "equipe_reception", taskType: 'ACTION', emailDetails: { sender: 'Service Client', subject: 'Avis de Retour', body: "Bonjour, \n\nLe client 'Garage Du Centre' nous retourne 1 'FEU ARRIERE' (ID: 2070649) car il est défectueux.\n\nMerci d'enregistrer ce retour dans le système." } },
        { taskOrder: 2, roleId: "equipe_reception", taskType: 'ACTION', prerequisiteTaskOrder: 1, emailDetails: { sender: 'Responsable Qualité', subject: 'Traitement du retour', body: "Après inspection, l'article retourné est irréparable. Merci de traiter le retour et de 'Mettre au rebut' l'article." } },
    ],
    createdBy: 'admin',
    environnementId: 'magasin_pedago'
  });

  // --- WMS SCENARIOS (FICTIF) ---
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 4,
    title: "WMS-F01 : Mise en place d'un nouveau fournisseur",
    description: "Créer un nouveau fournisseur et son catalogue de produits dans un environnement fictif.",
    competences: ["C1.1", "C1.2"],
    rolesRequis: ["chef_equipe"],
    tasks: [
        { taskOrder: 1, roleId: "chef_equipe", taskType: 'ACTION', emailDetails: { sender: 'Direction', subject: 'Nouveau partenariat', body: "Bonjour, nous allons travailler avec 'ElectroChic'. Veuillez les créer comme nouveau fournisseur. Utilisez l'outil IA de génération de données pour ajouter 20 articles dans le secteur 'Produits Électroniques et High-Tech' pour peupler leur catalogue." } },
    ],
    createdBy: 'admin',
    environnementId: 'entrepot_fictif_ecommerce'
  });

  initialScenarioTemplates.set(templateIdCounter++, {
    id: 5,
    title: "WMS-F02 : Correction d'inventaire massive",
    description: "Réaliser un inventaire sur un article avec un écart important et analyser les causes possibles.",
    competences: ["C3.1"],
    rolesRequis: ["equipe_reception"],
    tasks: [
        { taskOrder: 1, roleId: "equipe_reception", taskType: 'ACTION', emailDetails: { sender: 'SystemLogiSim', subject: 'Alerte Inventaire', body: "Un écart de stock significatif a été détecté sur un article. Veuillez trouver l'article avec le plus grand stock dans l'entrepôt, effectuez un comptage physique (simulé) de 50 unités et ajustez l'inventaire." } },
    ],
    createdBy: 'admin',
    environnementId: 'entrepot_fictif_ecommerce'
  });

  // --- TMS SCENARIOS ---
  initialScenarioTemplates.set(templateIdCounter++, {
    id: 6,
    title: "TMS01 : Création d'un devis transport",
    description: "Répondre à une demande client en créant un devis de transport via le module TMS.",
    competences: ["C4.1"],
    rolesRequis: ["tms_affreteur"],
    tasks: [
        { taskOrder: 1, roleId: "tms_affreteur", taskType: 'ACTION', emailDetails: { sender: 'commercial@logisim.hub', subject: 'Demande de devis - Client Express', body: "Bonjour, \n\nPouvez-vous établir un devis pour notre client 'Client Express' ?\n- Départ: Paris\n- Arrivée: Marseille\n- Distance: 780 km\n- Poids: 1200 kg\n- Nombre de palettes: 2\n\nCréez d'abord le client s'il n'existe pas." } },
    ],
    createdBy: 'admin',
    environnementId: 'agence_transport'
  });

  initialScenarioTemplates.set(templateIdCounter++, {
    id: 7,
    title: "TMS02: Gestion de flotte simple",
    description: "Ajouter un véhicule à la flotte et le mettre en maintenance.",
    competences: ["C4.2"],
    rolesRequis: ["tms_exploitation"],
    tasks: [
        { taskOrder: 1, roleId: "tms_exploitation", taskType: "ACTION", emailDetails: { sender: "Direction", subject: "Nouveau véhicule", body: "Bonjour, nous venons d'acquérir un nouveau semi-remorque. Veuillez l'ajouter à notre flotte avec les informations suivantes:\n- Immatriculation: NEW-TRUCK-01\n- Type: Semi-remorque\n- Capacité: 33 palettes" }},
        { taskOrder: 2, roleId: "tms_exploitation", taskType: "ACTION", prerequisiteTaskOrder: 1, emailDetails: { sender: "Atelier", subject: "Contrôle initial", body: "Le nouveau véhicule NEW-TRUCK-01 doit subir une inspection initiale. Veuillez le mettre en maintenance avec la note 'Inspection initiale avant mise en service'." }}
    ],
    createdBy: "admin",
    environnementId: "agence_transport"
});


  return {
    articles: articlesMap,
    tiers: initialTiers,
    documents: new Map(),
    movements: initialMovements,
    users: initialUsers,
    classes: initialClasses,
    emails: initialEmails,
    roles: ROLES,
    environments: ENVIRONMENTS,
    grillesTarifaires: GRILLES_TARIFAIRES,
    maintenances: new Map(),
    scenarioTemplates: initialScenarioTemplates,
    activeScenarios: new Map(),
    tasks: new Map(),
    tierIdCounter: 2,
    docIdCounter: 1,
    movementIdCounter: initialMovements.length + 1,
    classIdCounter: 2,
    emailIdCounter: emailIdCounter,
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
  | { type: 'UPDATE_ARTICLE_STATUS', payload: { articleId: string; status: Article['status']} }
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
  | { type: 'GENERATE_TIERS_BATCH'; payload: { tiers: { name: string, address: string, email: string}[], type: TierType } }
  | { type: 'RESET_ARTICLES_AND_TIERS'; payload: { environnementId: string } }
  | { type: 'START_MAINTENANCE'; payload: { vehiculeId: number, notes: string } }
  | { type: 'FINISH_MAINTENANCE'; payload: { maintenanceId: number } }
  | { type: 'UPDATE_STUDENT_ROLE', payload: { username: string, newRoleId: string } }
  | { type: 'DELETE_USER', payload: { username: string } }
  | { type: 'RESET_USER_PASSWORD', payload: { username: string, newPassword: string } }
  | { type: 'SET_STATE'; payload: WmsState }
  | { type: 'SET_ENVIRONMENT'; payload: { environmentId: string } };

const updateUserPermissions = (state: WmsState): WmsState => {
    if (state.currentUser) {
        const permissions = state.roles.get(state.currentUser.roleId)?.permissions || null;
        return { ...state, currentUserPermissions: permissions };
    }
    // If no user is logged in, permissions should be null.
    return { ...state, currentUserPermissions: null };
};

const validateAndUpdateTasks = (state: WmsState, action: WmsAction): WmsState => {
    if (!state.currentUser || state.currentUser.profile !== 'élève') return state;

    const { tasks, activeScenarios, currentEnvironmentId } = state;

    const userActiveScenario = Array.from(activeScenarios.values()).find(sc => sc.classId === state.currentUser?.classId && sc.status === 'running');
    if (!userActiveScenario) return state;

    // A task can only be completed in its designated environment.
    const userTasks = Array.from(tasks.values()).filter(t => t.userId === state.currentUser?.username && t.scenarioId === userActiveScenario.id && t.environnementId === currentEnvironmentId);
    const todoTasks = userTasks.filter(t => t.status === 'todo').sort((a,b) => a.taskOrder - b.taskOrder);

    let completedTaskId: number | null = null;
    let completedTaskOrder: number | null = null;

    for (const task of todoTasks) {
        let taskCompleted = false;

        switch (action.type) {
             case 'ADD_TIER': taskCompleted = true; break;
             case 'CREATE_DOCUMENT': taskCompleted = true; break;
             case 'UPDATE_DOCUMENT': taskCompleted = true; break;
        }
        
        if (taskCompleted) {
            completedTaskId = task.id;
            completedTaskOrder = task.taskOrder;
            break; 
        }
    }

    if (completedTaskId && completedTaskOrder !== null) {
        const newTasks = new Map(tasks);
        const newEmails = new Map(state.emails);
        let newEmailIdCounter = state.emailIdCounter;

        const completedTask = newTasks.get(completedTaskId);
        if (completedTask) {
            newTasks.set(completedTaskId, { ...completedTask, status: 'completed' });

            const scenarioTemplate = state.scenarioTemplates.get(userActiveScenario.templateId);
            if (scenarioTemplate) {
                 const nextTaskTemplate = scenarioTemplate.tasks.find(t => t.prerequisiteTaskOrder === completedTaskOrder && t.roleId === state.currentUser?.roleId);
                 if (nextTaskTemplate?.emailDetails) {
                    const email: Email = {
                        id: newEmailIdCounter++,
                        sender: nextTaskTemplate.emailDetails.sender,
                        recipient: state.currentUser!.username,
                        subject: nextTaskTemplate.emailDetails.subject,
                        body: nextTaskTemplate.emailDetails.body,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                    };
                    newEmails.set(email.id, email);
                 }
            }
            
            // Unblock next tasks for the user
            newTasks.forEach((task, taskId) => {
                if (task.userId === state.currentUser?.username && task.scenarioId === userActiveScenario.id && task.prerequisiteTaskOrder === completedTaskOrder) {
                    newTasks.set(taskId, {...task, status: 'todo'});
                }
            });


            return { ...state, tasks: newTasks, emails: newEmails, emailIdCounter: newEmailIdCounter };
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
        newState = { ...state, currentUser: user };
      } else {
        newState = state; 
      }
      break;
    }
     case 'REAUTHENTICATE_USER': {
      const { username } = action.payload;
      const user = state.users.get(username);
      if (user) {
        newState = { ...state, currentUser: user };
      } else {
        newState = { ...state, currentUser: null };
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
        scenarioTemplates: state.scenarioTemplates,
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
      const { id, name, location, stock, price, packaging, ean } = action.payload;
      if (state.articles.has(id)) {
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
        ean,
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
    case 'UPDATE_ARTICLE_STATUS': {
        if (!state.currentUserPermissions?.canManageStock) return state;
        const { articleId, status } = action.payload;
        const newArticles = new Map(state.articles);
        const article = newArticles.get(articleId);
        if (article) {
            newArticles.set(articleId, { ...article, status });
        }
        newState = { ...state, articles: newArticles };
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
      if (!state.currentUser) return state;
      const newEmails = new Map(state.emails);
      const newId = state.emailIdCounter;
      newEmails.set(newId, { ...action.payload, id: newId, timestamp: new Date().toISOString(), isRead: false });
      newState = { ...state, emails: newEmails, emailIdCounter: newId + 1 };
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
                        documentId: docToUpdate.id,
                    });
                } else if (line.returnDecision === 'Mettre au rebut') {
                    newMovements.push({
                        id: newMovementIdCounter++,
                        timestamp: new Date().toISOString(),
                        articleId: line.articleId,
                        type: 'Retour Client',
                        quantity: 0,
                        stockAfter: article.stock,
                        user: currentUser.username,
                        environnementId: state.currentEnvironmentId,
                        documentId: docToUpdate.id,
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
                        documentId: docToUpdate.id,
                    });

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
                                stockAfter: updatedArticle.stock,
                                user: currentUser.username,
                                environnementId: state.currentEnvironmentId,
                                documentId: docToUpdate.id,
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
                        documentId: docToUpdate.id,
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
        if (action.payload.id) { 
            const existing = newTemplates.get(action.payload.id);
            if(existing && (existing.createdBy === state.currentUser.username || state.currentUserPermissions.isSuperAdmin)) {
                newTemplates.set(action.payload.id, {...existing, ...action.payload, environnementId: state.currentEnvironmentId});
            }
        } else { 
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
        if (!template) return state;

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
        const newEmails = new Map(state.emails);
        let taskIdCounter = state.taskIdCounter;
        let emailIdCounter = state.emailIdCounter;

        if (rolesToAssign.length > 0) {
            studentsInClass.forEach((student, index) => {
                const roleId = rolesToAssign[index % rolesToAssign.length];
                const updatedUser = { ...student, roleId };
                newUsers.set(student.username, updatedUser);
            });
        }
        
        studentsInClass.forEach(student => {
            const studentRoleId = newUsers.get(student.username)?.roleId;
            template.tasks.forEach(taskTemplate => {
                if (taskTemplate.roleId === studentRoleId) {
                    const newTaskId = taskIdCounter++;
                    const isPrerequisiteMet = !taskTemplate.prerequisiteTaskOrder;
                    
                    newTasks.set(newTaskId, {
                        id: newTaskId,
                        scenarioId: newActiveScenarioId,
                        userId: student.username,
                        description: taskTemplate.emailDetails?.body ?? `Tâche: ${taskTemplate.taskType}`,
                        status: isPrerequisiteMet ? 'todo' : 'blocked',
                        taskType: taskTemplate.taskType,
                        taskOrder: taskTemplate.taskOrder,
                        prerequisiteTaskOrder: taskTemplate.prerequisiteTaskOrder,
                        environnementId: taskTemplate.environnementId || template.environnementId,
                    });

                    if (isPrerequisiteMet && taskTemplate.emailDetails) {
                        const email: Email = {
                            id: emailIdCounter++,
                            sender: taskTemplate.emailDetails.sender,
                            recipient: student.username,
                            subject: taskTemplate.emailDetails.subject,
                            body: taskTemplate.emailDetails.body,
                            timestamp: new Date().toISOString(),
                            isRead: false,
                        };
                        newEmails.set(email.id, email);
                    }
                }
            });
        });

        newState = {
            ...state,
            activeScenarios: newActiveScenarios,
            users: newUsers,
            tasks: newTasks,
            emails: newEmails,
            activeScenarioIdCounter: newActiveScenarioId + 1,
            taskIdCounter,
            emailIdCounter,
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
                    ean: faker.commerce.isbn().replace(/-/g, ''),
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
    case 'GENERATE_TIERS_BATCH': {
        if (!state.currentUser || !state.currentUserPermissions?.canManageTiers) return state;
        const newTiers = new Map(state.tiers);
        let tierIdCounter = state.tierIdCounter;

        action.payload.tiers.forEach(tierData => {
            const newTier: Tier = {
                id: tierIdCounter++,
                type: action.payload.type,
                name: tierData.name,
                address: tierData.address,
                email: tierData.email,
                createdAt: new Date().toISOString(),
                createdBy: state.currentUser!.username,
                environnementId: state.currentEnvironmentId,
            };
            newTiers.set(newTier.id, newTier);
        });

        newState = { ...state, tiers: newTiers, tierIdCounter };
        break;
    }
    case 'RESET_ARTICLES_AND_TIERS': {
        if (!state.currentUserPermissions?.canManageStock) return state;
        const { environnementId } = action.payload;
        const newArticles = new Map(state.articles);
        const newTiers = new Map(state.tiers);
        
        state.articles.forEach((article, key) => {
            if (article.environnementId === environnementId) {
                newArticles.delete(key);
            }
        });

        state.tiers.forEach((tier, key) => {
            if (tier.environnementId === environnementId) {
                newTiers.delete(key);
            }
        });

        const newMovements = state.movements.filter(m => m.environnementId !== environnementId);

        newState = { ...state, articles: newArticles, tiers: newTiers, movements: newMovements };
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
        newState = action.payload;
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
  // This is the critical part: After any action, recalculate permissions
  // and then check for task updates.
  const stateWithUpdatedPerms = updateUserPermissions(newState);
  return validateAndUpdateTasks(stateWithUpdatedPerms, action);
};

interface WmsContextType {
  state: WmsState;
  dispatch: React.Dispatch<WmsAction>;
  getArticle: (id: string) => Article | undefined;
  getTier: (id: number) => Tier | undefined;
  getDocument: (id: number) => Document | undefined;
  getClass: (id: number) => Class | undefined;
  getArticleWithComputedStock: (id: string) => (Article & { stockReserver: number; stockDisponible: number; }) | undefined;
}

const WmsContext = createContext<WmsContextType | undefined>(undefined);

export const WmsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(wmsReducer, getInitialState());

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem('wmsState');
      let finalState = getInitialState();

      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        const reviveMap = (arr: any) => arr ? new Map(arr) : new Map();

        finalState = {
            ...initialState,
            ...savedState,
            articles: new Map([...initialState.articles, ...reviveMap(savedState.articles)]),
            tiers: new Map([...initialState.tiers, ...reviveMap(savedState.tiers)]),
            documents: new Map([...initialState.documents, ...reviveMap(savedState.documents)]),
            users: new Map([...initialState.users, ...reviveMap(savedState.users)]),
            classes: new Map([...initialState.classes, ...reviveMap(savedState.classes)]),
            emails: reviveMap(savedState.emails) || new Map(),
            maintenances: reviveMap(savedState.maintenances) || new Map(),
            scenarioTemplates: new Map([...initialState.scenarioTemplates, ...reviveMap(savedState.scenarioTemplates)]),
            activeScenarios: reviveMap(savedState.activeScenarios) || new Map(),
            tasks: reviveMap(savedState.tasks) || new Map(),
            roles: ROLES,
            environments: ENVIRONMENTS,
            grillesTarifaires: GRILLES_TARIFAIRES,
            currentUser: null,
            currentUserPermissions: null,
        };
      }
      
      const lastUser = localStorage.getItem('wmsLastUser');
      if (lastUser && finalState.users.has(lastUser)) {
         finalState.currentUser = finalState.users.get(lastUser) || null;
         finalState = updateUserPermissions(finalState);
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
    // Only save to localStorage if the state has been initialized
    if (state.currentUser !== undefined) {
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
    }
  }, [state]);


  const getArticleWithComputedStock = (articleId: string) => {
    if (!state) return undefined;
    const article = state.articles.get(articleId);
    if (!article) return undefined;

    let stockReserver = 0;
    for (const doc of state.documents.values()) {
        if ((doc.type === 'Bon de Livraison Client' && (doc.status === 'En préparation' || doc.status === 'Prêt pour expédition')) && doc.environnementId === state.currentEnvironmentId) {
            for (const line of doc.lines) {
                if (line.articleId === articleId) {
                    stockReserver += line.quantity;
                }
            }
        }
    }
    const stockDisponible = article.stock - stockReserver;

    return { ...article, stockReserver, stockDisponible };
  }

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getArticle: (id: string) => state.articles.get(id),
    getTier: (id: number) => state.tiers.get(id),
    getDocument: (id: number) => state.documents.get(id),
    getClass: (id: number) => state.classes.get(id),
    getArticleWithComputedStock,
  }), [state]);

  if (!state) {
    return null; // or a loading spinner
  }

  return <WmsContext.Provider value={contextValue}>{children}</WmsContext.Provider>;
};

export const useWms = () => {
  const context = useContext(WmsContext);
  if (context === undefined) {
    throw new Error('useWms must be used within a WmsProvider');
  }
  return context;
};
