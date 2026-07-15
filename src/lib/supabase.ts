import { createClient } from '@supabase/supabase-js';
import { GasEvento, Configuracion, Usuario } from '../types';

// Let the user store Supabase credentials in localStorage to connect in-app,
// or fall back to Vite environment variables if available.
const STORAGE_KEYS = {
  URL: 'smartsense_supabase_url',
  KEY: 'smartsense_supabase_anon_key',
  IS_MOCK: 'smartsense_is_mock',
  EVENTS: 'smartsense_events',
  CONFIG: 'smartsense_config',
  USER: 'smartsense_user',
  ACTIVE_USER_ID: 'smartsense_active_user_id'
};

const getStoredCredential = (key: string, envVal?: string): string => {
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  return envVal || '';
};

const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

export const getSupabaseConfig = () => {
  return {
    url: getStoredCredential(STORAGE_KEYS.URL, envUrl),
    key: getStoredCredential(STORAGE_KEYS.KEY, envKey),
    isMock: localStorage.getItem(STORAGE_KEYS.IS_MOCK) !== 'false' && (!getStoredCredential(STORAGE_KEYS.URL, envUrl) || !getStoredCredential(STORAGE_KEYS.KEY, envKey))
  };
};

const config = getSupabaseConfig();

// Initialize real Supabase client only if credentials exist
export const supabase = !config.isMock && config.url && config.key
  ? createClient(config.url, config.key)
  : null;

// Realtime listeners
type GasEventCallback = (event: GasEvento) => void;
const subscribers = new Set<GasEventCallback>();

// Trigger real-time callbacks
export const notifySubscribers = (event: GasEvento) => {
  subscribers.forEach(cb => cb(event));
};

// SIMULATOR IMPLEMENTATION (Fills the requirement of out-of-the-box functionality)
const initializeMockData = () => {
  // 1. Initial configuration
  if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ id: 1, umbral_gas: 1500 }));
  }

  // 2. Initial user
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    const defaultUser: Usuario = {
      id: 1,
      nombre: 'Carlos Mendoza',
      email: 'carlos.mendoza@smartsense.io',
      telefono: '+34 612 345 678',
      wifi_ssid: 'SmartSense_IoT_2G',
      wifi_password: 'securepass123',
      notif_email: true,
      notif_sms: false,
      password: '123456'
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
  }

  // 3. Generate some historical events (last 50 events, going back in time)
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    const events: GasEvento[] = [];
    const now = new Date();
    const umbral = 1500;
    
    // Create base data with natural oscillation
    for (let i = 49; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 1000); // 1 minute intervals
      // Base natural variance, with occasional spikes
      let val = Math.floor(400 + Math.sin(i * 0.3) * 200 + Math.random() * 150);
      
      // Add a couple of spikes in history to show alerts
      if (i === 15 || i === 30 || i === 42) {
        val = Math.floor(1800 + Math.random() * 500);
      } else if (i === 5) {
        val = Math.floor(3200 + Math.random() * 400); // Critical hazard
      }

      events.push({
        id: `mock-${50 - i}`,
        created_at: time.toISOString(),
        valor_gas: val,
        alerta: val > umbral
      });
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }
};

initializeMockData();

// Mock database functions
export const mockDb = {
  getUmbral: (): number => {
    const conf = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (conf) {
      return JSON.parse(conf).umbral_gas;
    }
    return 1500;
  },

  updateUmbral: (newVal: number): void => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ id: 1, umbral_gas: newVal }));
    
    // Also update existing mock event alert statuses that are influenced by the new threshold
    const events = mockDb.getEventsRaw();
    const updatedEvents = events.map(e => ({
      ...e,
      alerta: e.valor_gas > newVal
    }));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updatedEvents));
  },

  getUsuario: (): Usuario => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    if (user) return JSON.parse(user);
    return {
      id: 1,
      nombre: 'Carlos Mendoza',
      email: 'carlos.mendoza@smartsense.io',
      telefono: '+34 612 345 678',
      wifi_ssid: 'SmartSense_IoT_2G',
      wifi_password: 'securepass123',
      notif_email: true,
      notif_sms: false,
      password: '123456'
    };
  },

  login: (email: string, password: string): Usuario | null => {
    // Check principal user
    const principal = mockDb.getUsuario();
    if (principal.email.toLowerCase() === email.toLowerCase() && principal.password === password) {
      return principal;
    }
    // Check extra users list
    const extras: Usuario[] = JSON.parse(localStorage.getItem('smartsense_users_list') || '[]');
    const found = extras.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    return found || null;
  },

  updateUsuario: (updated: Partial<Usuario>): Usuario => {
    const current = mockDb.getUsuario();
    const next = { ...current, ...updated };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
    return next;
  },

  getEventsRaw: (): GasEvento[] => {
    const events = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (events) return JSON.parse(events);
    return [];
  },

  getEventsFiltered: (
    options: {
      onlyAlerts?: boolean;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): GasEvento[] => {
    let events = mockDb.getEventsRaw();

    // Sort by created_at descending (newest first)
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (options.onlyAlerts) {
      events = events.filter(e => e.alerta);
    }

    if (options.dateFrom) {
      const fromTime = new Date(options.dateFrom).getTime();
      events = events.filter(e => new Date(e.created_at).getTime() >= fromTime);
    }

    if (options.dateTo) {
      // Set to end of day to include all events on that day
      const toDate = new Date(options.dateTo);
      toDate.setHours(23, 59, 59, 999);
      const toTime = toDate.getTime();
      events = events.filter(e => new Date(e.created_at).getTime() <= toTime);
    }

    return events;
  },

  addEvent: (valor_gas: number): GasEvento => {
    const events = mockDb.getEventsRaw();
    const umbral = mockDb.getUmbral();
    const newEvent: GasEvento = {
      id: `mock-${Date.now()}`,
      created_at: new Date().toISOString(),
      valor_gas,
      alerta: valor_gas > umbral
    };

    // Insert at start
    events.unshift(newEvent);
    // Maintain a reasonable max size of local history (e.g., 500 events)
    if (events.length > 500) {
      events.pop();
    }
    
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    notifySubscribers(newEvent);
    return newEvent;
  }
};

// API proxy helper to abstract Supabase vs Simulator
export const api = {
  isMock: () => {
    return getSupabaseConfig().isMock;
  },

  getUmbral: async (): Promise<number> => {
    const conf = getSupabaseConfig();
    if (conf.isMock || !supabase) {
      return mockDb.getUmbral();
    }
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('umbral_gas')
        .eq('id', 1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Row doesn't exist, insert default configuration row
          await supabase.from('configuracion').insert([{ id: 1, umbral_gas: 1500 }]);
          return 1500;
        }
        throw error;
      }
      return data.umbral_gas;
    } catch (err) {
      console.warn('Error reading from Supabase configuracion, using mock fallback:', err);
      return mockDb.getUmbral();
    }
  },

  updateUmbral: async (val: number): Promise<boolean> => {
    const conf = getSupabaseConfig();
    // Always update mock storage in case of fallback
    mockDb.updateUmbral(val);
    
    if (conf.isMock || !supabase) {
      return true;
    }
    try {
      const { error } = await supabase
        .from('configuracion')
        .update({ umbral_gas: val })
        .eq('id', 1);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating Supabase threshold:', err);
      return false;
    }
  },

  login: async (email: string, password: string): Promise<Usuario | null> => {
    const conf = getSupabaseConfig();
    if (conf.isMock || !supabase) {
      return mockDb.login(email, password);
    }
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('email', email)
        .eq('password', password)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null; // No match
        throw error;
      }
      return data;
    } catch (err) {
      console.warn('Supabase login error, using mock fallback:', err);
      return mockDb.login(email, password);
    }
  },

  getUsuario: async (idOverride?: number): Promise<Usuario> => {
    const conf = getSupabaseConfig();
    const activeId = idOverride ?? Number(localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) ?? 1);
    if (conf.isMock || !supabase) {
      // For mock mode, if activeId is 1, return principal; otherwise look in extras list
      if (activeId === 1 || !activeId) return mockDb.getUsuario();
      const extras: Usuario[] = JSON.parse(localStorage.getItem('smartsense_users_list') || '[]');
      const found = extras.find((u) => u.id === activeId);
      return found || mockDb.getUsuario();
    }
    try {
      const targetId = activeId || 1;
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Row doesn't exist, insert default user row
          const defaultUser = mockDb.getUsuario();
          await supabase.from('usuarios').insert([defaultUser]);
          return defaultUser;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.warn('Error fetching Supabase user, using mock fallback:', err);
      return mockDb.getUsuario();
    }
  },

  getUsuarios: async (): Promise<Usuario[]> => {
    const conf = getSupabaseConfig();
    if (conf.isMock || !supabase) {
      // Devuelve la lista simulada que incluye al principal y los extras si existen
      const principal = mockDb.getUsuario();
      const extras = JSON.parse(localStorage.getItem('smartsense_users_list') || '[]');
      return [principal, ...extras];
    }
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Error fetching all users, falling back to mock:', err);
      return [mockDb.getUsuario()];
    }
  },

  addUsuario: async (userData: Omit<Usuario, 'id'>): Promise<Usuario> => {
    const conf = getSupabaseConfig();
    if (conf.isMock || !supabase) {
      const newMockUser: Usuario = {
        id: Date.now(),
        ...userData
      };
      const currentUsers = JSON.parse(localStorage.getItem('smartsense_users_list') || '[]');
      currentUsers.push(newMockUser);
      localStorage.setItem('smartsense_users_list', JSON.stringify(currentUsers));
      return newMockUser;
    }
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([userData])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding user to Supabase:', err);
      throw err;
    }
  },

  deleteUsuario: async (id: number): Promise<boolean> => {
    const conf = getSupabaseConfig();
    if (conf.isMock || !supabase) {
      const currentUsers = JSON.parse(localStorage.getItem('smartsense_users_list') || '[]');
      const filtered = currentUsers.filter((u: any) => u.id !== id);
      localStorage.setItem('smartsense_users_list', JSON.stringify(filtered));
      return true;
    }
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting user from Supabase:', err);
      return false;
    }
  },

  updateUsuario: async (id: number, userData: Partial<Usuario>): Promise<Usuario> => {
    const conf = getSupabaseConfig();
    
    if (conf.isMock || !supabase) {
      if (id === 1) {
        return mockDb.updateUsuario(userData);
      }
      const currentUsers = JSON.parse(localStorage.getItem('smartsense_users_list') || '[]');
      const updatedList = currentUsers.map((u: any) => {
        if (u.id === id) {
          return { ...u, ...userData };
        }
        return u;
      });
      localStorage.setItem('smartsense_users_list', JSON.stringify(updatedList));
      return { id, ...userData } as Usuario;
    }
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`Error updating Supabase user id=${id}:`, err);
      if (id === 1) return mockDb.updateUsuario(userData);
      throw err;
    }
  },

  getGasEventos: async (options: {
    onlyAlerts?: boolean;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<GasEvento[]> => {
    const conf = getSupabaseConfig();
    if (conf.isMock || !supabase) {
      return mockDb.getEventsFiltered(options);
    }
    try {
      let query = supabase
        .from('gas_eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (options.onlyAlerts) {
        query = query.eq('alerta', true);
      }

      if (options.dateFrom) {
        query = query.gte('created_at', new Date(options.dateFrom).toISOString());
      }

      if (options.dateTo) {
        const toDate = new Date(options.dateTo);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Error reading events from Supabase, using mock fallback:', err);
      return mockDb.getEventsFiltered(options);
    }
  },

  // Setup Subscription
  subscribeToEvents: (callback: GasEventCallback) => {
    subscribers.add(callback);

    const conf = getSupabaseConfig();
    let supabaseSubscription: any = null;

    if (!conf.isMock && supabase) {
      // Connect real supabase realtime channel
      supabaseSubscription = supabase
        .channel('gas_eventos_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'gas_eventos' },
          (payload) => {
            const newEvent = payload.new as GasEvento;
            callback(newEvent);
          }
        )
        .subscribe();
    }

    // Return unsubscriber function
    return () => {
      subscribers.delete(callback);
      if (supabaseSubscription) {
        supabaseSubscription.unsubscribe();
      }
    };
  }
};

// Helper to save Supabase connection settings
export const saveSupabaseCredentials = (url: string, key: string, useMock: boolean) => {
  localStorage.setItem(STORAGE_KEYS.URL, url);
  localStorage.setItem(STORAGE_KEYS.KEY, key);
  localStorage.setItem(STORAGE_KEYS.IS_MOCK, useMock ? 'true' : 'false');
  
  // Reload page to re-initialize supabase connection
  window.location.reload();
};

export const clearSupabaseCredentials = () => {
  localStorage.removeItem(STORAGE_KEYS.URL);
  localStorage.removeItem(STORAGE_KEYS.KEY);
  localStorage.setItem(STORAGE_KEYS.IS_MOCK, 'true');
  window.location.reload();
};
