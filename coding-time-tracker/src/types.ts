/**
 * Daily coding statistics
 */
export interface IDayData{
    date: string; //Format: YYYY-MM--DD
    totalSeconds:number;
    languages: Record<string, number>;  // { typescript: 1800, javascript: 900 }
}

/**
 * Configuration stored in VS Code secrets
 */
export interface IFirebaseConfig{
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

/**
 * Internal tracking state
 */
export interface ITrackingState{
    isActive: boolean;
    sessionStartTime: number | null;
    currentDate: string;
    currentLanguage: string;
}

/**
 * Queued update for offline mode
 */
export interface IQueuedUpdate{
    userId: string;
    date: string;
    data: IDayData;
    timestamp: number;
}
