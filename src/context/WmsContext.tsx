

"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import type { Article, Tier, Document, Movement, User, Class, Email, Role, Permissions, ScenarioTemplate, ActiveScenario, Task, Environment, Maintenance, DocumentLine, TierType } from '@/lib/types';
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
        canManageClasses: true, canUseMessaging: true, canManageStudents: true, profile: "Administrateur"
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
        canManageClasses: true, canUseMessaging: true, canManageStudents: true, profile: "professeur"
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
        canManageStock: true, canViewStock: true, canManageClasses: false, canUseMessaging: true,
        canManageStudents: false, profile: "élève"
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
        canManageStock: true, canViewStock: true, canManageClasses: false, canUseMessaging: true,
        canManageStudents: false, profile: "élève"
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
        canManageStock: false, canViewStock: true, canManageClasses: false, canUseMessaging: true,
        canManageStudents: false, profile: "élève"
    }
});

const ENVIRONMENTS: Map<string, Environment> = new Map();
ENVIRONMENTS.set('magasin_pedago', {
    id: 'magasin_pedago',
    name: 'Magasin Pédagogique (Réel)',
    type: 'WMS',
    description: 'Stock physique du lycée. Lié au réel.'
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
  tierIdCounter: number;
  docIdCounter: number;
  movementIdCounter: number;
  classIdCounter: number;
  emailIdCounter: number;
  maintenanceIdCounter: number;
  currentUser: User | null;
  currentUserPermissions: Permissions | null;
  currentEnvironmentId: string;
}

export const getInitialState = (): WmsState => {
  const defaultEnvId = 'magasin_pedago';

  const articlesWithEnv = initialArticles.map(a => [a.id, {...a, environnementId: defaultEnvId, ean: faker.commerce.isbn().replace(/-/g, '') }]) as [string, Article][];
  const articlesMap = new Map(articlesWithEnv);

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

  const initialTiers = new Map<number, Tier>();
  
  const initialEmails = new Map<number, Email>();

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
    maintenances: new Map(),
    tierIdCounter: 1,
    docIdCounter: 1,
    movementIdCounter: initialMovements.length + 1,
    classIdCounter: 2,
    emailIdCounter: 1,
    maintenanceIdCounter: 1,
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
  | { type: 'START_MAINTENANCE'; payload: { vehiculeId: number, notes: string } }
  | { type: 'FINISH_MAINTENANCE'; payload: { maintenanceId: number } }
  | { type: 'UPDATE_STUDENT_ROLE', payload: { username: string, newRoleId: string } }
  | { type: 'DELETE_USER', payload: { username: string } }
  | { type: 'RESET_USER_PASSWORD', payload: { username: string, newPassword: string } }
  | { type: 'SET_STATE'; payload: WmsState };


const updateUserPermissions = (state: WmsState): WmsState => {
    if (state.currentUser) {
        const permissions = state.roles.get(state.currentUser.roleId)?.permissions || null;
        return { ...state, currentUserPermissions: permissions };
    }
    // If no user is logged in, permissions should be null.
    return { ...state, currentUserPermissions: null };
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
      newState = { 
        ...getInitialState(), 
        users: state.users,
        classes: state.classes,
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
        if (!state.currentUser || (type === 'Bon de Commande Fournisseur' && !perms?.canCreateBC) || (type === 'Bon de Livraison Client' && !perms?.canCreateBL) || (type === 'Lettre de Voiture' && !perms?.canShipBL) || (type === 'Retour Client' && !perms?.canReceiveBC) || (type === 'Devis Transport' && false) ) {
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
        newState = { ...state, users: newUsers };
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
    default:
      return state;
  }
  // This is the critical part: After any action, recalculate permissions
  const stateWithUpdatedPerms = updateUserPermissions(newState);
  return stateWithUpdatedPerms;
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
        const baseInitialState = getInitialState();

        finalState = {
            ...baseInitialState,
            ...savedState,
            articles: new Map([...baseInitialState.articles, ...reviveMap(savedState.articles)]),
            tiers: new Map([...baseInitialState.tiers, ...reviveMap(savedState.tiers)]),
            documents: new Map([...baseInitialState.documents, ...reviveMap(savedState.documents)]),
            users: new Map([...baseInitialState.users, ...reviveMap(savedState.users)]),
            classes: new Map([...baseInitialState.classes, ...reviveMap(savedState.classes)]),
            emails: reviveMap(savedState.emails) || new Map(),
            maintenances: reviveMap(savedState.maintenances) || new Map(),
            roles: ROLES,
            environments: ENVIRONMENTS,
            currentUser: null,
            currentUserPermissions: null,
        };
      }
      
      const lastUser = localStorage.getItem('wmsLastUser');
      if (lastUser && finalState.users.has(lastUser)) {
         finalState.currentUser = finalState.users.get(lastUser) || null;
         finalState = updateUserPermissions(finalState);
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
            roles: undefined, 
            environments: undefined,
            currentUser: undefined, 
            currentUserPermissions: undefined,
        };
        localStorage.setItem('wmsState', JSON.stringify(stateToSave));

        if (state.currentUser) {
            localStorage.setItem('wmsLastUser', state.currentUser.username);
        } else {
            localStorage.removeItem('wmsLastUser');
        }

      } catch (e) {
        console.error("Could not save state to localStorage.", e);
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
