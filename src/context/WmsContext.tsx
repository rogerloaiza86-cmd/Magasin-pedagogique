"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import type { Article, Tier, Document, Movement, DocumentLine } from '@/lib/types';
import { initialArticles } from '@/lib/articles-data';

interface WmsState {
  articles: Map<string, Article>;
  tiers: Map<number, Tier>;
  documents: Map<number, Document>;
  movements: Movement[];
  tierIdCounter: number;
  docIdCounter: number;
  movementIdCounter: number;
}

const initialMovements: Movement[] = initialArticles.map((article, index) => ({
    id: index + 1,
    timestamp: new Date().toISOString(),
    articleId: article.id,
    type: 'Initial',
    quantity: article.stock,
    stockAfter: article.stock,
}));

const initialState: WmsState = {
  articles: new Map(initialArticles.map(a => [a.id, a])),
  tiers: new Map(),
  documents: new Map(),
  movements: initialMovements,
  tierIdCounter: 1,
  docIdCounter: 1,
  movementIdCounter: initialMovements.length + 1,
};

type WmsAction =
  | { type: 'ADD_TIER'; payload: Omit<Tier, 'id'> }
  | { type: 'CREATE_DOCUMENT'; payload: Omit<Document, 'id' | 'createdAt'> }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'ADJUST_INVENTORY'; payload: { articleId: string; newStock: number; oldStock: number } };

const wmsReducer = (state: WmsState, action: WmsAction): WmsState => {
  switch (action.type) {
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
        if (oldDoc.status !== 'Réceptionné' && docToUpdate.status === 'Réceptionné') {
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
                    });
                }
            });
        }

        // On Delivery Note shipment
        if (oldDoc.status !== 'Expédié' && docToUpdate.status === 'Expédié') {
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
}

const WmsContext = createContext<WmsContextType | undefined>(undefined);

export const WmsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(wmsReducer, initialState);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getArticle: (id: string) => state.articles.get(id),
    getTier: (id: number) => state.tiers.get(id),
    getDocument: (id: number) => state.documents.get(id),
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
