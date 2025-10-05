import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/app/init';
import { trackApiCall, trackError } from '@/lib/telemetry';
import { mockApi } from '@/lib/mockData';

// Check if we're in development mode and should use mock data
const isDev = import.meta.env.VITE_ENV === 'dev' || import.meta.env.DEV;
const useMockData = isDev && import.meta.env.VITE_FIREBASE_PROJECT_ID === 'vizzy-local';

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Callable functions
export const callables = {
  validateCampaign: httpsCallable(functions, 'validateCampaign'),
  submitForReview: httpsCallable(functions, 'submitForReview'),
  approveCampaign: httpsCallable(functions, 'approveCampaign'),
  exportToWrike: httpsCallable(functions, 'exportToWrike'),
  aiSuggest: httpsCallable(functions, 'aiSuggest'),
};

// Generic API error class
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic CRUD operations
export class ApiService<T extends { id: string }> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, 'id'>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/create`, 'POST', 201, duration);
      
      return {
        ...data,
        id: docRef.id,
      } as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/create`, 'POST', 500, duration);
      trackError(error as Error, `create_${this.collectionName}`);
      throw new ApiError(
        `Failed to create ${this.collectionName}`,
        'CREATE_ERROR',
        500
      );
    }
  }

  async getById(id: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/${id}`, 'GET', 200, duration);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as T;
      }
      
      return null;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/${id}`, 'GET', 500, duration);
      trackError(error as Error, `get_${this.collectionName}_by_id`);
      throw new ApiError(
        `Failed to get ${this.collectionName}`,
        'GET_ERROR',
        500
      );
    }
  }

  async getAll(filters?: Record<string, unknown>): Promise<T[]> {
    const startTime = Date.now();
    
    // Use mock data in development mode
    if (useMockData) {
      try {
        let mockData: T[] = [];
        
        // Get appropriate mock data based on collection name
        switch (this.collectionName) {
          case 'users':
            mockData = await mockApi.getUsers() as T[];
            break;
          case 'stores':
            mockData = await mockApi.getStores() as T[];
            break;
          case 'campaigns':
            mockData = await mockApi.getCampaigns() as T[];
            break;
          case 'governance':
            mockData = await mockApi.getGovernance() as T[];
            break;
          case 'telemetry':
            mockData = await mockApi.getTelemetry() as T[];
            break;
          default:
            mockData = [];
        }
        
        // Apply filters to mock data
        if (filters) {
          mockData = mockData.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
              return (item as any)[key] === value;
            });
          });
        }
        
        const duration = Date.now() - startTime;
        trackApiCall(`${this.collectionName}`, 'GET', 200, duration);
        
        return mockData;
      } catch (error) {
        const duration = Date.now() - startTime;
        trackApiCall(`${this.collectionName}`, 'GET', 500, duration);
        trackError(error as Error, `get_all_${this.collectionName}_mock`);
        throw new ApiError(
          `Failed to get ${this.collectionName} list (mock)`,
          'GET_ALL_ERROR',
          500
        );
      }
    }
    
    try {
      let q = collection(db, this.collectionName);
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          q = query(q, where(key, '==', value));
        });
      }
      
      const querySnapshot = await getDocs(q);
      const results: T[] = [];
      
      querySnapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data(),
        } as T);
      });
      
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}`, 'GET', 200, duration);
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}`, 'GET', 500, duration);
      trackError(error as Error, `get_all_${this.collectionName}`);
      throw new ApiError(
        `Failed to get ${this.collectionName} list`,
        'GET_ALL_ERROR',
        500
      );
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/${id}`, 'PATCH', 200, duration);
      
      // Return updated document
      const updatedDoc = await this.getById(id);
      if (!updatedDoc) {
        throw new ApiError(
          `Document ${id} not found after update`,
          'UPDATE_ERROR',
          404
        );
      }
      
      return updatedDoc;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/${id}`, 'PATCH', 500, duration);
      trackError(error as Error, `update_${this.collectionName}`);
      throw new ApiError(
        `Failed to update ${this.collectionName}`,
        'UPDATE_ERROR',
        500
      );
    }
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/${id}`, 'DELETE', 200, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/${id}`, 'DELETE', 500, duration);
      trackError(error as Error, `delete_${this.collectionName}`);
      throw new ApiError(
        `Failed to delete ${this.collectionName}`,
        'DELETE_ERROR',
        500
      );
    }
  }

  async batchCreate(dataArray: Omit<T, 'id'>[]): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const batch = writeBatch(db);
      const results: T[] = [];
      
      dataArray.forEach((data) => {
        const docRef = doc(collection(db, this.collectionName));
        batch.set(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        results.push({
          ...data,
          id: docRef.id,
        } as T);
      });
      
      await batch.commit();
      
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/batch`, 'POST', 200, duration);
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiCall(`${this.collectionName}/batch`, 'POST', 500, duration);
      trackError(error as Error, `batch_create_${this.collectionName}`);
      throw new ApiError(
        `Failed to batch create ${this.collectionName}`,
        'BATCH_CREATE_ERROR',
        500
      );
    }
  }
}

// Utility function to convert Firestore timestamps
export function convertTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
  const converted = { ...obj };
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    if (value instanceof Timestamp) {
      converted[key] = value.toDate();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      converted[key] = convertTimestamps(value as Record<string, unknown>);
    }
  });
  
  return converted;
}

// Export specific services
export const campaignsApi = new ApiService('campaigns');
export const aiSuggestionsApi = new ApiService('aiSuggestions');
export const governanceApi = new ApiService('governance');
export const usersApi = new ApiService('users');
