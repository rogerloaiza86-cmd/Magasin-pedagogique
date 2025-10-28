"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import type { Article, Tier, Document, Movement, User, UserProfile, Class, Email } from '@/lib/types';
import { initialArticles } from '@/lib/articles-data';

interface WmsState {
  articles: Map<string, Article>;
  tiers: Map<number, Tier>;
  documents: Map<number, Document>;
  movements: Movement[];
  users: Map<string, User>;
  classes: Map<number, Class>;
  emails: Map<number, Email>;
  tierIdCounter: number;
  docIdCounter: number;
  movementIdCounter: number;
  classIdCounter: number;
  emailIdCounter: number;
  currentUser: User | null;
}

const getInitialState = (): WmsState => {
  const initialMovements: Movement[] = initialArticles.map((article, index) => ({
    id: index + 1,
    timestamp: new Date().toISOString(),
    articleId: article.id,
    type: 'Initial',
    quantity: article.stock,
    stockAfter: article.stock,
    user: 'Système',
  }));

  const initialUsers = new Map<string, User>();
  initialUsers.set('admin', { username: 'admin', password: 'admin', profile: 'Administrateur' });
  initialUsers.set('prof', { username: 'prof', password: 'prof', profile: 'professeur' });


  const initialClasses = new Map<number, Class>();
  initialClasses.set(1, { id: 1, name: '2GATL1 A', teacherIds: [] });
  initialClasses.set(2, { id: 2, name: '2GATL1 B', teacherIds: [] });
  initialClasses.set(3, { id: 3, name: '2GATL2 A', teacherIds: [] });
  initialClasses.set(4, { id: 4, name: '2GATL2 B', teacherIds: [] });
  initialClasses.set(5, { id: 5, name: '2GATL3 A', teacherIds: [] });
  initialClasses.set(6, { id: 6, name: '2GATL3 B', teacherIds: [] });


  return {
    articles: new Map(initialArticles.map(a => [a.id, a])),
    tiers: new Map(),
    documents: new Map(),
    movements: initialMovements,
    users: initialUsers,
    classes: initialClasses,
    emails: new Map(),
    tierIdCounter: 1,
    docIdCounter: 1,
    movementIdCounter: initialMovements.length + 1,
    classIdCounter: 7,
    emailIdCounter: 1,
    currentUser: null,
  };
};

type WmsAction =
  | { type: 'ADD_TIER'; payload: Omit<Tier, 'id'> }
  | { type: 'CREATE_DOCUMENT'; payload: Omit<Document, 'id' | 'createdAt'> }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'ADJUST_INVENTORY'; payload: { articleId: string; newStock: number; oldStock: number } }
  | { type: 'LOGIN'; payload: { username: string, password: string} }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_USER', payload: Omit<User, 'password'> & { password?: string, classId?: number } }
  | { type: 'TOGGLE_TEACHER_CLASS_ASSIGNMENT', payload: { classId: number, teacherId: string } }
  | { type: 'SEND_EMAIL'; payload: Omit<Email, 'id' | 'timestamp' | 'isRead'> }
  | { type: 'MARK_EMAIL_AS_READ'; payload: { emailId: number } }
  | { type: 'SET_STATE'; payload: WmsState };


const wmsReducer = (state: WmsState, action: WmsAction): WmsState => {
  switch (action.type) {
    case 'LOGIN': {
      const { username, password } = action.payload;
      const user = state.users.get(username);
      if (user && user.password === password) {
        return { ...state, currentUser: user };
      }
      throw new Error("Identifiant ou mot de passe incorrect.");
    }
    case 'LOGOUT':
      // Reset the entire state but keep users and articles
      const freshState = getInitialState();
      return { ...freshState, currentUser: null, users: state.users, articles: state.articles, movements: state.movements, classes: state.classes, emails: state.emails };
    case 'REGISTER_USER': {
        const { username, password, profile, classId } = action.payload;
        if (state.users.has(username)) {
            throw new Error("Cet identifiant existe déjà.");
        }
        if (!password) {
            throw new Error("Le mot de passe est requis.");
        }
        const newUsers = new Map(state.users);
        const newUser: User = { username, password, profile };
        if (profile === 'élève' && classId) {
            newUser.classId = classId;
        }
        newUsers.set(username, newUser);
        return { ...state, users: newUsers };
    }
    case 'TOGGLE_TEACHER_CLASS_ASSIGNMENT': {
        const { classId, teacherId } = action.payload;
        const newClasses = new Map(state.classes);
        const classToUpdate = newClasses.get(classId);

        if (classToUpdate) {
            const teacherIds = classToUpdate.teacherIds || [];
            const isAssigned = teacherIds.includes(teacherId);

            if (isAssigned) {
                // Unassign
                const newTeacherIds = teacherIds.filter(id => id !== teacherId);
                newClasses.set(classId, { ...classToUpdate, teacherIds: newTeacherIds });
            } else {
                // Assign
                const newTeacherIds = [...teacherIds, teacherId];
                newClasses.set(classId, { ...classToUpdate, teacherIds: newTeacherIds });
            }
            return { ...state, classes: newClasses };
        }
        return state;
    }
    case 'SEND_EMAIL': {
      const newEmailData = action.payload;
      const newEmails = new Map(state.emails);
      let emailIdCounter = state.emailIdCounter;

      // Main email
      const mainEmail: Email = {
        ...newEmailData,
        id: emailIdCounter++,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      newEmails.set(mainEmail.id, mainEmail);

      // CC to teachers if applicable
      const recipientUser = state.users.get(newEmailData.recipient);
      if (state.currentUser?.profile === 'élève' && recipientUser?.profile === 'élève') {
        const studentClass = state.classes.get(state.currentUser.classId!);
        if (studentClass?.teacherIds && studentClass.teacherIds.length > 0) {
            studentClass.teacherIds.forEach(teacherId => {
                 if (newEmailData.recipient !== teacherId && newEmailData.sender !== teacherId) {
                    const ccEmail: Email = {
                        ...newEmailData,
                        id: emailIdCounter++,
                        recipient: teacherId, // The recipient is the teacher
                        subject: `[Copie de ${newEmailData.sender}] ${newEmailData.subject}`,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                    };
                    newEmails.set(ccEmail.id, ccEmail);
                 }
            });
        }
      }
      
      return { ...state, emails: newEmails, emailIdCounter };
    }
    case 'MARK_EMAIL_AS_READ': {
      const newEmails = new Map(state.emails);
      const email = newEmails.get(action.payload.emailId);
      if (email) {
        newEmails.set(action.payload.emailId, { ...email, isRead: true });
        return { ...state, emails: newEmails };
      }
      return state;
    }
    case 'SET_STATE':
        return action.payload;
    case 'ADD_TIER': {
      const newTier: Tier = { ...action.payload, id: state.tierIdCounter };
      const newTiers = new Map(state.tiers);
      newTiers.set(newTier.id, newTier);
      return { ...state, tiers: newTiers, tierIdCounter: state.tierIdCounter + 1 };
    }
    case 'CREATE_DOCUMENT': {
        const newDoc: Document = { ...action.payload, id: state.docIdCounter, createdAt: new Date().toISOString() };
        const newDocuments = new Map(state.documents);
        newDocuments.set(newDoc.id, newDoc);
        return { ...state, documents: newDocuments, docIdCounter: state.docIdCounter + 1 };
    }
    case 'UPDATE_DOCUMENT': {
        const updatedDocuments = new Map(state.documents);
        const docToUpdate = action.payload;

        // Handle stock updates and movements
        const oldDoc = state.documents.get(docToUpdate.id);
        if(!oldDoc) return state;

        const newArticles = new Map(state.articles);
        const newMovements = [...state.movements];
        let newMovementIdCounter = state.movementIdCounter;

        // On Purchase Order reception
        if (oldDoc.type === 'Bon de Commande Fournisseur' && oldDoc.status !== 'Réceptionné' && docToUpdate.status === 'Réceptionné') {
            docToUpdate.lines.forEach(line => {
                const article = newArticles.get(line.articleId);
                if (article) {
                    const newStock = article.stock + line.quantity;
                    newArticles.set(line.articleId, { ...article, stock: newStock });
                    newMovements.push({
                        id: newMovementIdCounter++,
                        timestamp: new Date().toISOString(),
                        articleId: line.articleId,
                        type: 'Entrée (Réception BC)',
                        quantity: line.quantity,
                        stockAfter: newStock,
                        user: state.currentUser?.username || 'Inconnu',
                    });
                }
            });
        }

        // On Delivery Note shipment
        if (oldDoc.type === 'Bon de Livraison Client' && oldDoc.status !== 'Expédié' && docToUpdate.status === 'Expédié') {
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
                        user: state.currentUser?.username || 'Inconnu',
                    });
                }
            });
        }
        
        updatedDocuments.set(docToUpdate.id, docToUpdate);

        return { ...state, documents: updatedDocuments, articles: newArticles, movements: newMovements, movementIdCounter: newMovementIdCounter };
    }
    case 'ADJUST_INVENTORY': {
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
          user: state.currentUser?.username || "Inconnu",
        };
        return {
          ...state,
          articles: newArticles,
          movements: [...state.movements, newMovement],
          movementIdCounter: state.movementIdCounter + 1,
        };
      }
      return state;
    }
    default:
      return state;
  }
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
  const [state, dispatch] = useReducer(wmsReducer, getInitialState());

  // Load state from localStorage on startup
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('wmsState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Re-hydrate Maps from arrays
        parsedState.articles = new Map(parsedState.articles);
        parsedState.tiers = new Map(parsedState.tiers.map((t: Tier) => [t.id, t]));
        parsedState.documents = new Map(parsedState.documents.map((d: Document) => [d.id, d]));
        parsedState.users = new Map(parsedState.users);
        parsedState.classes = parsedState.classes ? new Map(parsedState.classes.map((c: Class) => [c.id, c])) : getInitialState().classes;
        parsedState.emails = parsedState.emails ? new Map(parsedState.emails.map((e: Email) => [e.id, e])) : new Map();
        
        // Prevent user from being logged in on refresh
        parsedState.currentUser = null;

        dispatch({ type: 'SET_STATE', payload: parsedState });
      }
    } catch (e) {
      console.error("Could not load state from localStorage. Using initial state.", e);
      dispatch({ type: 'SET_STATE', payload: getInitialState() });
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const stateToSave = {
          ...state,
          // Convert Maps to arrays for JSON serialization
          articles: Array.from(state.articles.entries()),
          tiers: Array.from(state.tiers.values()),
          documents: Array.from(state.documents.values()),
          users: Array.from(state.users.entries()),
          classes: Array.from(state.classes.values()),
          emails: Array.from(state.emails.values()),
      };
      localStorage.setItem('wmsState', JSON.stringify(stateToSave));
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
