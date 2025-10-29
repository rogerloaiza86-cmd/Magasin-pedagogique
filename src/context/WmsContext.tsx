
"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import type { Article, Tier, Document, Movement, User, Class, Email, Role, Permissions, ScenarioTemplate, ActiveScenario, Task, Environment, Maintenance, DocumentLine } from '@/lib/types';
import { initialArticles } from '@/lib/articles-data';
import { faker } from '@faker-js/faker/locale/fr';

// --- ROLES & PERMISSIONS DEFINITION ---
const ROLES: Map<string, Role> = new Map();

ROLES.set('super_admin', {
    id: 'super_admin',
    name: "Superviseur (Enseignant/Admin)",
    description: "Accès total à l'application.",
    isStudentRole: false,
    permissions: {
        isSuperAdmin: true,
        canViewDashboard: true, canManageTiers: true, canViewTiers: true, canCreateBC: true, canReceiveBC: true,
        canCreateBL: true, canPrepareBL: true, canShipBL: true, canManageStock: true, canViewStock: true,
        canManageClasses: true, canUseIaTools: true, canUseMessaging: true, canManageScenarios: true,
        canManageFleet: true,
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
        canManageScenarios: false, canManageFleet: false,
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
        canManageScenarios: false, canManageFleet: false,
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
        canManageScenarios: false, canManageFleet: false,
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
        canManageScenarios: false, canManageFleet: true,
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
  initialUsers.set('prof', { username: 'prof', password: 'prof', profile: 'professeur', createdAt: new Date().toISOString(), roleId: 'super_admin' });

  return {
    articles: articlesMap,
    tiers: new Map(),
    documents: new Map(),
    movements: initialMovements,
    users: initialUsers,
    classes: new Map(),
    emails: new Map(),
    roles: ROLES,
    environments: ENVIRONMENTS,
    maintenances: new Map(),
    scenarioTemplates: new Map(),
    activeScenarios: new Map(),
    tasks: new Map(),
    tierIdCounter: 1,
    docIdCounter: 1,
    movementIdCounter: initialMovements.length + 1,
    classIdCounter: 1,
    emailIdCounter: 1,
    maintenanceIdCounter: 1,
    scenarioTemplateIdCounter: 1,
    activeScenarioIdCounter: 1,
    taskIdCounter: 1,
    currentUser: null,
    currentUserPermissions: null,
    currentEnvironmentId: defaultEnvId,
  };
};

type WmsAction =
  | { type: 'ADD_TIER'; payload: Omit<Tier, 'id' | 'createdAt' | 'createdBy' | 'environnementId'> }
  | { type: 'CREATE_DOCUMENT'; payload: Omit<Document, 'id' | 'createdAt' | 'createdBy' | 'environnementId'> }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'ADJUST_INVENTORY'; payload: { articleId: string; newStock: number; oldStock: number } }
  | { type: 'LOGIN'; payload: { username: string, password: string} }
  | { type: 'REAUTHENTICATE_USER'; payload: { username: string } }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_USER', payload: Omit<User, 'password' | 'createdAt' | 'roleId'> & { password?: string, classId?: number } }
  | { type: 'ADD_CLASS', payload: { name: string } }
  | { type: 'DELETE_CLASS', payload: { classId: number } }
  | { type: 'TOGGLE_TEACHER_CLASS_ASSIGNMENT', payload: { classId: number, teacherId: string } }
  | { type: 'SEND_EMAIL'; payload: Omit<Email, 'id' | 'timestamp' | 'isRead'> }
  | { type: 'MARK_EMAIL_AS_READ'; payload: { emailId: number } }
  | { type: 'SAVE_SCENARIO_TEMPLATE'; payload: Omit<ScenarioTemplate, 'id' | 'createdBy' | 'environnementId'> & { id?: number } }
  | { type: 'DELETE_SCENARIO_TEMPLATE'; payload: { templateId: number } }
  | { type: 'LAUNCH_SCENARIO', payload: { templateId: number, classId: number } }
  | { type: 'GENERATE_DATA'; payload: { environnementId: string, articles: number, clients: number, suppliers: number } }
  | { type: 'START_MAINTENANCE'; payload: { vehiculeId: number, notes: string } }
  | { type: 'FINISH_MAINTENANCE'; payload: { maintenanceId: number } }
  | { type: 'SET_STATE'; payload: WmsState }
  | { type: 'SET_ENVIRONMENT'; payload: { environmentId: string } };

const validateAndUpdateTasks = (state: WmsState, action: WmsAction): WmsState => {
    const { currentUser, tasks, activeScenarios } = state;
    if (!currentUser) return state;

    const userActiveScenario = Array.from(activeScenarios.values()).find(sc => sc.classId === currentUser.classId && sc.status === 'running' && sc.environnementId === state.currentEnvironmentId);
    if (!userActiveScenario) return state;

    const userTasks = Array.from(tasks.values()).filter(t => t.userId === currentUser.username && t.scenarioId === userActiveScenario.id);
    const todoTasks = userTasks.filter(t => t.status === 'todo');

    let completedTaskId: number | null = null;

    for (const task of todoTasks) {
        let taskCompleted = false;
        switch (task.taskType) {
            case 'CREATE_TIERS_CLIENT':
                if (action.type === 'ADD_TIER' && action.payload.type === 'Client') taskCompleted = true;
                break;
            case 'CREATE_TIERS_FOURNISSEUR':
                if (action.type === 'ADD_TIER' && action.payload.type === 'Fournisseur') taskCompleted = true;
                break;
            case 'CREATE_TIERS_TRANSPORTEUR':
                if (action.type === 'ADD_TIER' && action.payload.type === 'Transporteur') taskCompleted = true;
                break;
            case 'CREATE_BC':
                if (action.type === 'CREATE_DOCUMENT' && action.payload.type === 'Bon de Commande Fournisseur') taskCompleted = true;
                break;
            case 'RECEIVE_BC':
                 if (action.type === 'UPDATE_DOCUMENT' && action.payload.type === 'Bon de Commande Fournisseur' && action.payload.status.startsWith('Réceptionné')) taskCompleted = true;
                break;
            case 'CREATE_BL':
                 if (action.type === 'CREATE_DOCUMENT' && action.payload.type === 'Bon de Livraison Client') taskCompleted = true;
                break;
            case 'PREPARE_BL': // This is a virtual step for now, linked to SHIP_BL
            case 'SHIP_BL':
                if (action.type === 'UPDATE_DOCUMENT' && action.payload.type === 'Bon de Livraison Client' && action.payload.status === 'Expédié') taskCompleted = true;
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

            // Unlock next tasks
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
        throw new Error("Identifiant ou mot de passe incorrect.");
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
        const { username, password, profile, classId } = action.payload;
        if (state.users.has(username)) {
            throw new Error("Cet identifiant existe déjà.");
        }
        if (!password) {
            throw new Error("Le mot de passe est requis.");
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
            roleId: profile === 'élève' ? 'equipe_preparation' : 'super_admin' // Default role
        };
        if (profile === 'élève' && classId) {
            newUser.classId = classId;
        }
        newUsers.set(username, newUser);
        newState = { ...state, users: newUsers };
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
        if (!state.currentUser || (type === 'Bon de Commande Fournisseur' && !perms?.canCreateBC) || (type === 'Bon de Livraison Client' && !perms?.canCreateBL) || (type === 'Lettre de Voiture' && !perms?.canShipBL) || (type === 'Retour Client' && !perms?.canReceiveBC) ) {
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
        if (!template) return state;

        const newActiveScenarioId = state.activeScenarioIdCounter;
        const newActiveScenario: ActiveScenario = {
            id: newActiveScenarioId,
            templateId,
            classId,
            status: 'running',
            createdAt: new Date().toISOString(),
            environnementId: state.currentEnvironmentId,
        };
        const newActiveScenarios = new Map(state.activeScenarios);
        newActiveScenarios.set(newActiveScenarioId, newActiveScenario);

        const studentsInClass = Array.from(state.users.values()).filter(u => u.classId === classId && u.profile === 'élève');
        const rolesToAssign = template.rolesRequis;
        const newUsers = new Map(state.users);
        const newTasks = new Map(state.tasks);
        let taskIdCounter = state.taskIdCounter;

        studentsInClass.forEach((student, index) => {
            const roleId = rolesToAssign[index % rolesToAssign.length];
            const updatedUser = {...student, roleId};
            newUsers.set(student.username, updatedUser);

            const studentTasks = template.tasks.filter(t => t.roleId === roleId);
            const taskCreationMap = new Map<number, number>(); // template.taskOrder -> new taskId

            studentTasks.forEach(taskTemplate => {
                const newTask: Task = {
                    id: taskIdCounter,
                    scenarioId: newActiveScenarioId,
                    userId: student.username,
                    description: taskTemplate.description,
                    taskType: taskTemplate.taskType,
                    status: 'blocked',
                    details: taskTemplate.details,
                    taskOrder: taskTemplate.taskOrder,
                    prerequisiteTaskId: undefined,
                    environnementId: state.currentEnvironmentId,
                };
                newTasks.set(taskIdCounter, newTask);
                taskCreationMap.set(taskTemplate.taskOrder, taskIdCounter);
                taskIdCounter++;
            });
            
            newTasks.forEach(task => {
                if (task.userId === student.username && task.scenarioId === newActiveScenarioId) {
                    const originalTemplate = template.tasks.find(t => t.taskOrder === task.taskOrder && t.roleId === roleId);
                    if (originalTemplate) {
                       if (originalTemplate.prerequisite) {
                           const prereqNewId = taskCreationMap.get(originalTemplate.prerequisite);
                           task.prerequisiteTaskId = prereqNewId;
                       }
                       if (!task.prerequisiteTaskId) {
                           task.status = 'todo';
                       }
                    }
                }
            });
        });

        const updatedCurrentUser = state.currentUser ? newUsers.get(state.currentUser.username) || state.currentUser : null;
        const updatedPermissions = updatedCurrentUser ? state.roles.get(updatedCurrentUser.roleId)?.permissions || null : null;


        newState = {
            ...state,
            activeScenarios: newActiveScenarios,
            users: newUsers,
            tasks: newTasks,
            activeScenarioIdCounter: newActiveScenarioId + 1,
            taskIdCounter: taskIdCounter,
            currentUser: updatedCurrentUser,
            currentUserPermissions: updatedPermissions
        };
        break;
    }
    case 'GENERATE_DATA': {
        if (!state.currentUserPermissions?.isSuperAdmin || !state.currentUser) return state;
        const { environnementId, articles, clients, suppliers } = action.payload;
        const newArticles = new Map(state.articles);
        const newTiers = new Map(state.tiers);
        const newMovements = [...state.movements];
        let movementIdCounter = state.movementIdCounter;
        let tierIdCounter = state.tierIdCounter;

        for (let i = 0; i < articles; i++) {
            const newArticle: Article = {
                id: `SKU-${environnementId.substring(0,4).toUpperCase()}-${faker.string.alphanumeric(6).toUpperCase()}`,
                name: faker.commerce.productName(),
                location: `${faker.string.alpha(1).toUpperCase()}.${faker.number.int({min:1, max:3})}.${faker.number.int({min:1, max:6})}.${faker.string.alpha(1).toUpperCase()}`,
                packaging: 'PIEC',
                price: parseFloat(faker.commerce.price()),
                stock: faker.number.int({ min: 50, max: 1000 }),
                environnementId,
                status: 'Actif',
            };
            newArticles.set(newArticle.id, newArticle);
            newMovements.push({
                id: movementIdCounter++,
                articleId: newArticle.id,
                quantity: newArticle.stock,
                stockAfter: newArticle.stock,
                timestamp: new Date().toISOString(),
                type: 'Génération',
                user: 'Système',
                environnementId,
            })
        }
        
        for (let i = 0; i < clients; i++) {
             const newClient: Tier = {
                id: tierIdCounter++,
                name: faker.company.name(),
                address: `${faker.location.streetAddress()}, ${faker.location.zipCode()} ${faker.location.city()}`,
                type: 'Client',
                createdBy: state.currentUser.username,
                createdAt: new Date().toISOString(),
                environnementId,
             };
             newTiers.set(newClient.id, newClient);
        }
        
        for (let i = 0; i < suppliers; i++) {
             const newSupplier: Tier = {
                id: tierIdCounter++,
                name: faker.company.name(),
                address: `${faker.location.streetAddress()}, ${faker.location.zipCode()} ${faker.location.city()}`,
                type: 'Fournisseur',
                createdBy: state.currentUser.username,
                createdAt: new Date().toISOString(),
                environnementId,
             };
             newTiers.set(newSupplier.id, newSupplier);
        }

        newState = { 
            ...state, 
            articles: newArticles, 
            tiers: newTiers, 
            movements: newMovements,
            movementIdCounter,
            tierIdCounter,
        };
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
      const savedState = localStorage.getItem('wmsState');
      const initialState = getInitialState();
      let combinedState;

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        const articlesFromStorage = parsedState.articles ? new Map(parsedState.articles) : new Map();
        
        // Use initial articles for the default environment, and stored articles for others.
        const mergedArticles = new Map(initialState.articles);
        articlesFromStorage.forEach((value: Article, key: string) => {
            if(value.environnementId !== initialState.currentEnvironmentId) {
                 mergedArticles.set(key, value);
            }
        });

        combinedState = {
            ...initialState,
            ...parsedState,
            articles: mergedArticles,
            tiers: parsedState.tiers ? new Map(parsedState.tiers.map((t: Tier) => [t.id, t])) : initialState.tiers,
            documents: parsedState.documents ? new Map(parsedState.documents.map((d: Document) => [d.id, d])) : initialState.documents,
            movements: parsedState.movements || initialState.movements,
            users: parsedState.users ? new Map(parsedState.users) : initialState.users,
            classes: parsedState.classes ? new Map(parsedState.classes.map((c: Class) => [c.id, c])) : initialState.classes,
            emails: parsedState.emails ? new Map(parsedState.emails.map((e: Email) => [e.id, e])) : initialState.emails,
            maintenances: parsedState.maintenances ? new Map(parsedState.maintenances.map((m: Maintenance) => [m.id, m])) : initialState.maintenances,
            scenarioTemplates: parsedState.scenarioTemplates ? new Map(parsedState.scenarioTemplates.map((st: ScenarioTemplate) => [st.id, st])) : initialState.scenarioTemplates,
            activeScenarios: parsedState.activeScenarios ? new Map(parsedState.activeScenarios.map((as: ActiveScenario) => [as.id, as])) : initialState.activeScenarios,
            tasks: parsedState.tasks ? new Map(parsedState.tasks.map((t: Task) => [t.id, t])) : initialState.tasks,

            roles: ROLES,
            environments: ENVIRONMENTS,
        };
      } else {
        combinedState = initialState;
      }
      
      const lastUser = localStorage.getItem('wmsLastUser');
      if (lastUser && combinedState.users.has(lastUser)) {
         const user = combinedState.users.get(lastUser);
         if (user) {
            combinedState.currentUser = user;
            combinedState.currentUserPermissions = combinedState.roles.get(user.roleId)?.permissions || null;
         }
      }
      
      const lastEnv = localStorage.getItem('wmsLastEnv');
      if(lastEnv && combinedState.environments.has(lastEnv)) {
          combinedState.currentEnvironmentId = lastEnv;
      } else {
          combinedState.currentEnvironmentId = getInitialState().currentEnvironmentId;
      }

      dispatch({ type: 'SET_STATE', payload: combinedState });

    } catch (e) {
      console.error("Could not load state from localStorage. Using initial state.", e);
    }
  }, []);

  useEffect(() => {
    try {
      const stateToSave = {
          ...state,
          articles: Array.from(state.articles.entries()),
          tiers: Array.from(state.tiers.values()),
          documents: Array.from(state.documents.values()),
          users: Array.from(state.users.entries()),
          classes: Array.from(state.classes.values()),
          emails: Array.from(state.emails.values()),
          maintenances: Array.from(state.maintenances.values()),
          scenarioTemplates: Array.from(state.scenarioTemplates.values()),
          activeScenarios: Array.from(state.activeScenarios.values()),
          tasks: Array.from(state.tasks.values()),
          roles: [], // Static, no need to save
          environments: [], // Static
          currentUser: null, 
          currentUserPermissions: null,
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

    