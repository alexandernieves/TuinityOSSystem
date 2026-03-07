import type { Product, ProductGroup } from '@/lib/types/product';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

// Re-export types for convenience
export type { Product, ProductGroup } from '@/lib/types/product';

/**
 * Mock products for Evolution OS prototype.
 * Real data extracted from Dynamo POS.
 */
export const SEED_PRODUCTS: Product[] = [
  {
    id: 'EVL-00001',
    reference: 'EVL-00001',
    description: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'BLACK & WHITE',
    supplier: 'GLOBAL BRANDS, S.A.',
    country: 'ESCOCIA',
    barcode: '0000050196166',
    barcodes: [
      { code: '0000050196166', label: 'Caja' },
      { code: '5000196166001', label: 'Botella' },
    ],
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 24,
    casesPerBulk: 24,
    casesPerPallet: 60,
    dimensions: { length: 8, width: 11, height: 15 },
    cubicMeters: 0.00132,
    cubicFeet: 0.04663,
    weightPerCase: 17.3,
    reorderPoint: 30,
    minimumQty: 20,
    stock: { existence: 0, arriving: 129, reserved: 0, available: 129 },
    prices: { A: 111, B: 106, C: 102, D: 97, E: 97 },
    costFOB: 73.0,
    costCIF: 83.95,
    costAvgWeighted: 82.5,
    priceB2C: 6.99,
    status: 'active',
    image: '/images/products/black-white.jpg',
  },
  {
    id: 'EVL-00002',
    reference: 'EVL-00002',
    description: 'WHISKY JOHNNIE WALKER RED NR 12X750ML 40%VOL',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'JOHNNIE WALKER',
    supplier: 'TRIPLE DOUBLE TRADING LLC',
    country: 'ESCOCIA',
    barcode: '5000267014005',
    barcodes: [
      { code: '5000267014005', label: 'Caja' },
      { code: '5000267014012', label: 'Botella' },
      { code: '5000267014029', label: 'Inner Pack' },
    ],
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 12,
    casesPerBulk: 12,
    casesPerPallet: 80,
    dimensions: { length: 30, width: 22, height: 32 },
    cubicMeters: 0.02112,
    cubicFeet: 0.74578,
    weightPerCase: 12.5,
    reorderPoint: 40,
    minimumQty: 50,
    stock: { existence: 100, arriving: 0, reserved: 30, available: 70 },
    prices: { A: 120, B: 115, C: 110, D: 105, E: 102 },
    costFOB: 73.0,
    costCIF: 83.95,
    costAvgWeighted: 82.5,
    priceB2C: 14.99,
    brandProtection: true,
    brandProtectionRate: 0.05,
    status: 'active',
    image: '/images/products/jw-red.jpg',
  },
  {
    id: 'EVL-00003',
    reference: 'EVL-00003',
    description: 'WHISKY JOHNNIE WALKER BLACK 12YRS 24X375ML 40%V',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'JOHNNIE WALKER',
    supplier: 'TRIPLE DOUBLE TRADING LLC',
    country: 'ESCOCIA',
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 24,
    reorderPoint: 20,
    minimumQty: 25,
    stock: { existence: 50, arriving: 0, reserved: 20, available: 30 },
    prices: { A: 290, B: 278, C: 265, D: 255, E: 250 },
    costFOB: 195.0,
    costCIF: 224.25,
    costAvgWeighted: 201.12,
    priceB2C: 17.99,
    brandProtection: true,
    brandProtectionRate: 0.05,
    status: 'active',
  },
  {
    id: 'EVL-00004',
    reference: 'EVL-00004',
    description: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
    group: 'TEQUILA',
    subGroup: 'TEQUILA',
    brand: 'DON JULIO',
    supplier: 'TRIPLE DOUBLE TRADING LLC',
    country: 'MEXICO',
    barcodes: [
      { code: '7500289390105', label: 'Caja' },
      { code: '7500289390112', label: 'Botella' },
    ],
    tariffCode: '2208909000',
    unit: 'CJA',
    unitsPerCase: 6,
    reorderPoint: 5,
    minimumQty: 5,
    stock: { existence: 23, arriving: 0, reserved: 10, available: 13 },
    prices: { A: 780, B: 750, C: 720, D: 695, E: 680 },
    costFOB: 528.0,
    costCIF: 607.2,
    costAvgWeighted: 595.0,
    priceB2C: 189.99,
    brandProtection: true,
    brandProtectionRate: 0.05,
    status: 'active',
  },
  {
    id: 'EVL-00005',
    reference: 'EVL-00005',
    description: 'TEQUILA CLASE AZUL REPOSADO GB 6X750ML 40%',
    group: 'TEQUILA',
    subGroup: 'TEQUILA',
    brand: 'CLASE AZUL',
    supplier: 'TRIPLE DOUBLE TRADING LLC',
    country: 'MEXICO',
    tariffCode: '2208909000',
    unit: 'CJA',
    unitsPerCase: 6,
    reorderPoint: 3,
    minimumQty: 3,
    stock: { existence: 7, arriving: 0, reserved: 5, available: 2 },
    prices: { A: 1250, B: 1200, C: 1150, D: 1100, E: 1080 },
    costFOB: 840.0,
    costCIF: 966.0,
    costAvgWeighted: 952.0,
    priceB2C: 299.99,
    status: 'active',
  },
  {
    id: 'EVL-00006',
    reference: 'EVL-00006',
    description: 'VINO SPERONE PROSECCO 12X750ML 11.5%V',
    group: 'VINO',
    subGroup: 'VINO',
    brand: 'SPERONE',
    supplier: 'JP CHENET',
    country: 'ITALIA',
    tariffCode: '2204109000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 15,
    stock: { existence: 43, arriving: 0, reserved: 10, available: 33 },
    prices: { A: 67, B: 64, C: 61, D: 58, E: 56 },
    costFOB: 38.0,
    costCIF: 43.7,
    costAvgWeighted: 42.5,
    priceB2C: 8.99,
    status: 'active',
  },
  {
    id: 'EVL-00007',
    reference: 'EVL-00007',
    description: 'VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO',
    group: 'VODKA',
    subGroup: 'VODKA',
    brand: 'SMIRNOFF',
    supplier: 'GLOBAL BRANDS, S.A.',
    country: 'ESTADOS UNIDOS',
    tariffCode: '2208601000',
    unit: 'CJA',
    unitsPerCase: 6,
    reorderPoint: 10,
    minimumQty: 10,
    stock: { existence: 30, arriving: 0, reserved: 5, available: 25 },
    prices: { A: 85, B: 82, C: 79, D: 76, E: 74 },
    costFOB: 52.0,
    costCIF: 59.8,
    costAvgWeighted: 58.5,
    priceB2C: 19.99,
    status: 'active',
  },
  {
    id: 'EVL-00008',
    reference: 'EVL-00008',
    description: 'GINEBRA HENDRICKS RF 12X1000ML 44% VOL',
    group: 'GINEBRA',
    subGroup: 'GINEBRA',
    brand: 'HENDRICKS',
    supplier: 'GLOBAL BRANDS, S.A.',
    country: 'ESCOCIA',
    tariffCode: '2208509000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 10,
    stock: { existence: 28, arriving: 0, reserved: 20, available: 8 },
    prices: { A: 258, B: 248, C: 238, D: 228, E: 222 },
    costFOB: 165.0,
    costCIF: 189.75,
    costAvgWeighted: 185.0,
    priceB2C: 32.99,
    status: 'active',
  },
  {
    id: 'EVL-00009',
    reference: 'EVL-00009',
    description: 'WHISKY CHIVAS REGAL 12YRS S/C NR 12X750',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'CHIVAS REGAL',
    supplier: 'ADYCORP',
    country: 'ESCOCIA',
    barcodes: [
      { code: '5000299210017', label: 'Caja' },
      { code: '5000299210024', label: 'Botella' },
    ],
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 12,
    reorderPoint: 25,
    minimumQty: 30,
    stock: { existence: 119, arriving: 0, reserved: 100, available: 19 },
    prices: { A: 194, B: 186, C: 178, D: 170, E: 166 },
    costFOB: 125.0,
    costCIF: 143.75,
    costAvgWeighted: 140.0,
    priceB2C: 24.99,
    status: 'active',
  },
  {
    id: 'EVL-00010',
    reference: 'EVL-00010',
    description: 'RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X750ML',
    group: 'RON',
    subGroup: 'RON',
    brand: 'DIPLOMATICO',
    supplier: 'JP CHENET',
    country: 'VENEZUELA',
    tariffCode: '2208401000',
    unit: 'CJA',
    unitsPerCase: 6,
    reorderPoint: 8,
    minimumQty: 10,
    stock: { existence: 46, arriving: 0, reserved: 10, available: 36 },
    prices: { A: 125, B: 120, C: 115, D: 110, E: 108 },
    costFOB: 75.0,
    costCIF: 86.25,
    costAvgWeighted: 84.0,
    priceB2C: 29.99,
    status: 'active',
  },
  {
    id: 'EVL-00011',
    reference: 'EVL-00011',
    description: 'LICOR AMARETTO DISARONNO RF 12X750ML',
    group: 'LICOR',
    subGroup: 'LICOR',
    brand: 'DISARONNO',
    supplier: 'JP CHENET',
    country: 'ITALIA',
    tariffCode: '2208709000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 15,
    stock: { existence: 100, arriving: 0, reserved: 100, available: 0 },
    prices: { A: 157, B: 150, C: 143, D: 137, E: 134 },
    costFOB: 95.0,
    costCIF: 109.25,
    costAvgWeighted: 106.0,
    priceB2C: 18.99,
    status: 'active',
  },
  {
    id: 'EVL-00012',
    reference: 'EVL-00012',
    description: 'WHISKY JACK DANIELS N°7 BLACK MINI 120X50ML 40%V',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'JACK DANIELS',
    supplier: 'GLOBAL BRANDS, S.A.',
    country: 'ESTADOS UNIDOS',
    barcode: '10764009031560',
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 120,
    minimumQty: 20,
    stock: { existence: 0, arriving: 0, reserved: 0, available: 0 },
    prices: { A: 111, B: 106, C: 102, D: 97, E: 97 },
    costFOB: 68.0,
    costCIF: 78.2,
    costAvgWeighted: 76.5,
    priceB2C: 1.99,
    status: 'active',
  },
  {
    id: 'EVL-00013',
    reference: 'EVL-00013',
    description: 'WHISKY GLENFIDDICH 12AÑO CRCH 12X750ML 40%',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'GLENFIDDICH',
    supplier: 'TRIPLE DOUBLE TRADING LLC',
    country: 'ESCOCIA',
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 10,
    stock: { existence: 25, arriving: 0, reserved: 5, available: 20 },
    prices: { A: 380, B: 365, C: 350, D: 338, E: 330 },
    costFOB: 255.0,
    costCIF: 293.25,
    costAvgWeighted: 288.0,
    priceB2C: 45.99,
    status: 'active',
  },
  {
    id: 'EVL-00014',
    reference: 'EVL-00014',
    description: 'WHISKY MONKEY SHOULDER 6X700ML 40%VOL',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'MONKEY SHOULDER',
    supplier: 'TRIPLE DOUBLE TRADING LLC',
    country: 'ESCOCIA',
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 6,
    minimumQty: 10,
    stock: { existence: 30, arriving: 0, reserved: 8, available: 22 },
    prices: { A: 135, B: 130, C: 125, D: 120, E: 117 },
    costFOB: 88.0,
    costCIF: 101.2,
    costAvgWeighted: 99.0,
    priceB2C: 32.99,
    status: 'active',
  },
  {
    id: 'EVL-00015',
    reference: 'EVL-00015',
    description: 'RON CAPTAIN MORGAN BLACK SPICED 12X1000ML 40%',
    group: 'RON',
    subGroup: 'RON',
    brand: 'CAPTAIN MORGAN',
    supplier: 'JP CHENET',
    country: 'JAMAICA',
    tariffCode: '2208401000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 15,
    stock: { existence: 45, arriving: 20, reserved: 12, available: 53 },
    prices: { A: 98, B: 94, C: 90, D: 87, E: 85 },
    costFOB: 58.0,
    costCIF: 66.7,
    costAvgWeighted: 65.0,
    priceB2C: 12.99,
    status: 'active',
  },
  {
    id: 'EVL-00016',
    reference: 'EVL-00016',
    description: 'LICOR KAHLUA CAFE 12X750ML 16%VOL',
    group: 'LICOR',
    subGroup: 'LICOR',
    brand: 'KAHLUA',
    supplier: 'JP CHENET',
    country: 'MEXICO',
    tariffCode: '2208709000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 15,
    stock: { existence: 65, arriving: 0, reserved: 50, available: 15 },
    prices: { A: 77, B: 74, C: 71, D: 68, E: 66 },
    costFOB: 45.0,
    costCIF: 51.75,
    costAvgWeighted: 50.5,
    priceB2C: 9.99,
    status: 'active',
  },
  {
    id: 'EVL-00017',
    reference: 'EVL-00017',
    description: 'RON MCCORMICK GOLD 12X1000ML 40%VOL',
    group: 'RON',
    subGroup: 'RON',
    brand: 'MCCORMICK',
    supplier: 'GLOBAL BRANDS, S.A.',
    country: 'ESTADOS UNIDOS',
    tariffCode: '2208401000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 30,
    stock: { existence: 131, arriving: 0, reserved: 20, available: 111 },
    prices: { A: 38, B: 36, C: 34, D: 33, E: 32 },
    costFOB: 22.0,
    costCIF: 25.3,
    costAvgWeighted: 24.8,
    priceB2C: 4.99,
    status: 'active',
  },
  {
    id: 'EVL-00018',
    reference: 'EVL-00018',
    description: 'SNACKS PRINGLES BBQ 12X149G',
    group: 'SNACKS',
    subGroup: 'PAPITAS',
    brand: 'PRINGLES',
    supplier: 'ADYCORP',
    country: 'ESTADOS UNIDOS',
    tariffCode: '2005200000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 20,
    stock: { existence: 35, arriving: 0, reserved: 0, available: 35 },
    prices: { A: 28, B: 27, C: 26, D: 25, E: 24 },
    costFOB: 16.0,
    costCIF: 18.4,
    costAvgWeighted: 18.0,
    priceB2C: 3.49,
    status: 'active',
  },
  {
    id: 'EVL-00019',
    reference: 'EVL-00019',
    description: 'TEQUILA 1800 COCONUT R NK 12X750ML 35%V',
    group: 'TEQUILA',
    subGroup: 'TEQUILA',
    brand: '1800',
    supplier: 'TRIPLE DOUBLE TRADING LLC',
    country: 'MEXICO',
    tariffCode: '2208909000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 15,
    stock: { existence: 47, arriving: 0, reserved: 15, available: 32 },
    prices: { A: 175, B: 168, C: 161, D: 155, E: 151 },
    costFOB: 115.0,
    costCIF: 132.25,
    costAvgWeighted: 129.0,
    priceB2C: 21.99,
    status: 'active',
  },
  {
    id: 'EVL-00020',
    reference: 'EVL-00020',
    description: 'WHISKY GLENLIVET 12YO DOUBLE OAK R GB 12X750ML',
    group: 'WHISKY',
    subGroup: 'WHISKY',
    brand: 'GLENLIVET',
    supplier: 'JP CHENET',
    country: 'ESCOCIA',
    tariffCode: '2208309000',
    unit: 'CJA',
    unitsPerCase: 12,
    minimumQty: 5,
    stock: { existence: 9, arriving: 0, reserved: 0, available: 9 },
    prices: { A: 496, B: 476, C: 456, D: 440, E: 430 },
    costFOB: 320.0,
    costCIF: 368.0,
    costAvgWeighted: 360.0,
    priceB2C: 59.99,
    status: 'active',
  },
];

/**
 * Product categories (groups and subgroups)
 */
const SEED_PRODUCT_GROUPS: ProductGroup[] = [
  { id: 'WHISKY', label: 'Whisky', subGroups: ['WHISKY', 'BOURBON', 'SCOTCH'] },
  { id: 'RON', label: 'Ron', subGroups: ['RON', 'RON OSCURO', 'RON BLANCO'] },
  { id: 'VODKA', label: 'Vodka', subGroups: ['VODKA'] },
  { id: 'TEQUILA', label: 'Tequila', subGroups: ['TEQUILA', 'MEZCAL'] },
  { id: 'GINEBRA', label: 'Ginebra', subGroups: ['GINEBRA'] },
  { id: 'VINO', label: 'Vino', subGroups: ['VINO', 'ESPUMANTE', 'CHAMPAÑA'] },
  { id: 'CERVEZA', label: 'Cerveza', subGroups: ['CERVEZA'] },
  { id: 'LICOR', label: 'Licor', subGroups: ['LICOR', 'CREMA'] },
  { id: 'BRANDY', label: 'Brandy', subGroups: ['BRANDY', 'COGNAC'] },
  { id: 'SNACKS', label: 'Snacks', subGroups: ['PAPITAS', 'OTROS'] },
  { id: 'BEBIDA', label: 'Bebidas', subGroups: ['ENERGIZANTE', 'JUGO', 'MIXER'] },
  { id: 'COCKTEL', label: 'Cóctel', subGroups: ['BASE', 'PREMIX'] },
];

// ============================================================================
// STORE INFRASTRUCTURE – Products
// ============================================================================

let _products: Product[] = SEED_PRODUCTS;
let _initialized = false;
const { subscribe: subscribeProducts, notify: _notifyProducts } = createSubscribers();

function ensureInitialized(): void {
  if (typeof window === 'undefined' || _initialized) return;
  _products = loadCollection<Product>('products', SEED_PRODUCTS);
  _initialized = true;
}

export function getProductsData(): Product[] {
  ensureInitialized();
  return _products;
}

export { subscribeProducts };

// Backward-compatible export
export const MOCK_PRODUCTS: Product[] = new Proxy(SEED_PRODUCTS as Product[], {
  get(_target, prop, receiver) {
    ensureInitialized();
    return Reflect.get(_products, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – Product Groups
// ============================================================================

let _productGroups: ProductGroup[] = SEED_PRODUCT_GROUPS;
let _groupsInitialized = false;
const { subscribe: subscribeProductGroups, notify: _notifyProductGroups } = createSubscribers();

function ensureGroupsInitialized(): void {
  if (typeof window === 'undefined' || _groupsInitialized) return;
  _productGroups = loadCollection<ProductGroup>('product_groups', SEED_PRODUCT_GROUPS);
  _groupsInitialized = true;
}

export function getProductGroupsData(): ProductGroup[] {
  ensureGroupsInitialized();
  return _productGroups;
}

export { subscribeProductGroups };

// Backward-compatible export
export const PRODUCT_GROUPS: ProductGroup[] = new Proxy(SEED_PRODUCT_GROUPS as ProductGroup[], {
  get(_target, prop, receiver) {
    ensureGroupsInitialized();
    return Reflect.get(_productGroups, prop, receiver);
  },
});

// ============================================================================
// CRUD OPERATIONS – Products
// ============================================================================

export function addProduct(product: Product): void {
  ensureInitialized();
  _products = [..._products, product];
  saveCollection('products', _products);
  _notifyProducts();
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  ensureInitialized();
  _products = _products.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveCollection('products', _products);
  _notifyProducts();
}

export function removeProduct(id: string): void {
  ensureInitialized();
  _products = _products.filter((p) => p.id !== id);
  saveCollection('products', _products);
  _notifyProducts();
}

// ============================================================================
// CRUD OPERATIONS – Product Groups
// ============================================================================

export function addProductGroup(group: ProductGroup): void {
  ensureGroupsInitialized();
  _productGroups = [..._productGroups, group];
  saveCollection('product_groups', _productGroups);
  _notifyProductGroups();
}

export function updateProductGroup(id: string, updates: Partial<ProductGroup>): void {
  ensureGroupsInitialized();
  _productGroups = _productGroups.map((g) => (g.id === id ? { ...g, ...updates } : g));
  saveCollection('product_groups', _productGroups);
  _notifyProductGroups();
}

export function removeProductGroup(id: string): void {
  ensureGroupsInitialized();
  _productGroups = _productGroups.filter((g) => g.id !== id);
  saveCollection('product_groups', _productGroups);
  _notifyProductGroups();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get product by ID
 */
export function getProductById(id: string): Product | undefined {
  ensureInitialized();
  return _products.find((p) => p.id === id);
}

/**
 * Get unique brands from products
 */
export function getUniqueBrands(): string[] {
  ensureInitialized();
  return [...new Set(_products.map((p) => p.brand))].sort();
}

/**
 * Get unique suppliers from products
 */
export function getUniqueSuppliers(): string[] {
  ensureInitialized();
  return [...new Set(_products.map((p) => p.supplier))].sort();
}

/**
 * Calculate product stats
 */
export function getProductStats() {
  ensureInitialized();
  const total = _products.length;
  const active = _products.filter((p) => p.status === 'active').length;
  const outOfStock = _products.filter((p) => p.stock.available === 0).length;
  const lowStock = _products.filter(
    (p) => p.stock.available > 0 && p.stock.available < p.minimumQty
  ).length;
  const arriving = _products.filter((p) => p.stock.arriving > 0).length;

  return { total, active, outOfStock, lowStock, arriving };
}
