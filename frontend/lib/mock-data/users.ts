import type { User } from '@/lib/types/user';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

/**
 * Seed users for Evolution OS prototype.
 * These are real team members from Evolution Zona Libre.
 */
const SEED_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Javier Lange',
    email: 'javier@evolutionzl.com',
    role: 'gerencia',
    avatar: '/images/avatars/javier.jpg',
  },
  {
    id: 'USR-002',
    name: 'Astelvia Watts',
    email: 'gerencia1@evolutionzl.com',
    role: 'gerencia',
    avatar: '/images/avatars/astelvia.jpg',
  },
  {
    id: 'USR-003',
    name: 'Jakeira Chavez',
    email: 'contabilidad@evolutionzl.com',
    role: 'contabilidad',
    avatar: '/images/avatars/jakeira.jpg',
  },
  {
    id: 'USR-004',
    name: 'Ariel Brome',
    email: 'trafico1@evolutionzl.com',
    role: 'trafico',
    avatar: '/images/avatars/ariel.jpg',
  },
  {
    id: 'USR-005',
    name: 'Margarita Morelos',
    email: 'ventas1@evolutionzl.com',
    role: 'vendedor',
    avatar: '/images/avatars/margarita.jpg',
  },
  {
    id: 'USR-006',
    name: 'Arnold Arenas',
    email: 'arnold@evolutionzl.com',
    role: 'vendedor',
    avatar: '/images/avatars/arnold.jpg',
  },
  {
    id: 'USR-007',
    name: 'Celideth Dominguez',
    email: 'bodega@evolutionzl.com',
    role: 'compras',
    avatar: '/images/avatars/celideth.jpg',
  },
  {
    id: 'USR-008',
    name: 'Jesus Ferreira',
    email: 'compras@evolutionzl.com',
    role: 'bodega',
    avatar: '/images/avatars/jesus.jpg',
  },
  {
    id: 'USR-009',
    name: 'Marelis Gonzalez',
    email: 'showroom@evolutionzl.com',
    role: 'vendedor',
    avatar: '/images/avatars/marelis.jpg',
  },
  {
    id: 'USR-010',
    name: 'Elisa Garay',
    email: 'cajera@evolutionzl.com',
    role: 'vendedor',
    avatar: '/images/avatars/elisa.jpg',
  },
];

// ============================================================================
// STORE INFRASTRUCTURE
// ============================================================================

let _users: User[] = SEED_USERS;
let _initialized = false;
const { subscribe: subscribeUsers, notify: _notifyUsers } = createSubscribers();

function ensureInitialized(): void {
  if (typeof window === 'undefined' || _initialized) return;
  _users = loadCollection<User>('users', SEED_USERS);
  _initialized = true;
}

export function getUsersData(): User[] {
  ensureInitialized();
  return _users;
}

export { subscribeUsers };

// Backward-compatible export
export const MOCK_USERS: User[] = new Proxy(SEED_USERS as User[], {
  get(_target, prop, receiver) {
    ensureInitialized();
    return Reflect.get(_users, prop, receiver);
  },
});

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export function addUser(user: User): void {
  ensureInitialized();
  _users = [..._users, user];
  saveCollection('users', _users);
  _notifyUsers();
}

export function updateUser(id: string, updates: Partial<User>): void {
  ensureInitialized();
  _users = _users.map((u) =>
    u.id === id ? { ...u, ...updates } : u
  );
  saveCollection('users', _users);
  _notifyUsers();
}

export function removeUser(id: string): void {
  ensureInitialized();
  _users = _users.filter((u) => u.id !== id);
  saveCollection('users', _users);
  _notifyUsers();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user by email (for mock login)
 */
export function getUserByEmail(email: string): User | undefined {
  ensureInitialized();
  return _users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | undefined {
  ensureInitialized();
  return _users.find((user) => user.id === id);
}
