import { User, SavedScenario } from "../types";

const USERS_KEY = "pdh_users";
const SESSION_KEY = "pdh_session";
const SCENARIOS_KEY_PREFIX = "pdh_scenarios_";

export const authService = {
  // --- Auth ---
  register: (email: string, name: string, password: string): User => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: any[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find((u) => u.email === email)) {
      throw new Error("User already exists");
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      name,
      password, // In a real app, hash this!
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login
    const userSession: User = { id: newUser.id, email: newUser.email, name: newUser.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
    
    return userSession;
  },

  login: (email: string, password: string): User => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: any[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find((u) => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const userSession: User = { id: user.id, email: user.email, name: user.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
    return userSession;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  // --- Data Persistence ---
  saveScenario: (userId: string, scenario: Omit<SavedScenario, "id" | "timestamp">) => {
    const key = `${SCENARIOS_KEY_PREFIX}${userId}`;
    const existingStr = localStorage.getItem(key);
    const scenarios: SavedScenario[] = existingStr ? JSON.parse(existingStr) : [];

    const newScenario: SavedScenario = {
      ...scenario,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    scenarios.unshift(newScenario); // Add to top
    localStorage.setItem(key, JSON.stringify(scenarios));
    return newScenario;
  },

  getScenarios: (userId: string): SavedScenario[] => {
    const key = `${SCENARIOS_KEY_PREFIX}${userId}`;
    const existingStr = localStorage.getItem(key);
    return existingStr ? JSON.parse(existingStr) : [];
  },
  
  deleteScenario: (userId: string, scenarioId: string) => {
    const key = `${SCENARIOS_KEY_PREFIX}${userId}`;
    const existingStr = localStorage.getItem(key);
    let scenarios: SavedScenario[] = existingStr ? JSON.parse(existingStr) : [];
    
    scenarios = scenarios.filter(s => s.id !== scenarioId);
    localStorage.setItem(key, JSON.stringify(scenarios));
    return scenarios;
  }
};
