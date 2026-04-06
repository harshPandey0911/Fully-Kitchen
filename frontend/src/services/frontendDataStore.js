import { APP_NAME, APP_STORAGE_PREFIX } from '../constants/branding';
import {
  getWarrantyDetails,
  initialOwnedProducts,
  initialServiceRequests,
} from '../data/customerOwnership';

const FRONTEND_DB_KEY = `${APP_STORAGE_PREFIX}FrontendDb`;
const LEGACY_ACCOUNT_KEY = `${APP_STORAGE_PREFIX}UnifiedRoleAccounts`;

const DEFAULT_ADMIN = {
  id: 'admin-root',
  name: 'Harsh Pandey',
  email: 'harshpandey09112004@gmail.com',
  password: 'harsh@123',
  role: 'admin',
  createdAt: '2026-04-05T00:00:00.000Z',
  updatedAt: '2026-04-05T00:00:00.000Z',
  loginCount: 0,
  lastLoginAt: '',
};

const DEFAULT_INVENTORY_ITEMS = [
  { name: 'Induction Cooktop', category: 'Cooking', price: 12499, quantity: 45, sku: 'ADM-IC-124' },
  { name: 'Washing Machine', category: 'Laundry', price: 34999, quantity: 8, sku: 'ADM-WM-349' },
  { name: 'Refrigerator', category: 'Cooling', price: 48500, quantity: 22, sku: 'ADM-RF-485' },
  { name: 'Mixer Grinder', category: 'Kitchen', price: 3199, quantity: 65, sku: 'ADM-MG-319' },
  { name: 'Water Purifier', category: 'Water', price: 15800, quantity: 5, sku: 'ADM-WP-158' },
  { name: 'Microwave Oven', category: 'Cooking', price: 8999, quantity: 12, sku: 'ADM-MO-899' },
];

const canUseStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const clone = (value) => JSON.parse(JSON.stringify(value));

const createId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const hasAtSymbol = (value = '') => normalizeEmail(value).includes('@');

const createAppError = (message, extras = {}) => Object.assign(new Error(message), extras);

const toTitleCase = (value = '') =>
  String(value)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const deriveNameFromEmail = (email = '', fallback = 'User') => {
  const localPart = normalizeEmail(email).split('@')[0] || '';
  return toTitleCase(localPart) || fallback;
};

const readJson = (key, fallback) => {
  if (!canUseStorage()) {
    return clone(fallback);
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch {
    return clone(fallback);
  }
};

const writeJson = (key, value) => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
};

const toDisplayDate = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const deriveInventoryStatus = (quantity) => (Number(quantity || 0) < 10 ? 'Low Stock' : 'In Stock');

const categoryMap = [
  { match: 'induction', category: 'Cooking' },
  { match: 'microwave', category: 'Cooking' },
  { match: 'air fryer', category: 'Cooking' },
  { match: 'washing', category: 'Laundry' },
  { match: 'refrigerator', category: 'Cooling' },
  { match: 'water', category: 'Water' },
  { match: 'kettle', category: 'Kitchen' },
  { match: 'toaster', category: 'Kitchen' },
  { match: 'mixer', category: 'Kitchen' },
];

const resolveCategory = (name, fallback = 'Kitchen') => {
  const normalizedName = String(name || '').trim().toLowerCase();
  const match = categoryMap.find((entry) => normalizedName.includes(entry.match));
  return match?.category || fallback;
};

const createSku = (name = 'Product') => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.slice(0, 2).toUpperCase());

  const stem = parts.length ? parts.join('') : 'PRD';
  const suffix = Math.floor(100 + Math.random() * 900);
  return `ADM-${stem}-${suffix}`;
};

const resolveWarrantySnapshot = (purchaseDate, warrantyMonths) => {
  const details = getWarrantyDetails(purchaseDate, warrantyMonths);

  if (details.status === 'expired') {
    return {
      status: 'Expired',
      expiryDate: details.expiryDate || '',
    };
  }

  if (details.status === 'active' && details.daysRemaining <= 30) {
    return {
      status: 'Expiring Soon',
      expiryDate: details.expiryDate || '',
    };
  }

  return {
    status: 'Active',
    expiryDate: details.expiryDate || '',
  };
};

const sanitizeCustomer = (record = {}, existing = {}) => ({
  id: record.id || existing.id || createId('cust'),
  name: String(record.name || existing.name || 'Customer').trim(),
  email: normalizeEmail(record.email || existing.email),
  password: String(record.password || existing.password || '').trim(),
  phone: String(record.phone || existing.phone || '').trim(),
  role: 'customer',
  createdAt: record.createdAt || existing.createdAt || nowIso(),
  updatedAt: nowIso(),
  loginCount: Number(record.loginCount ?? existing.loginCount ?? 0),
  lastLoginAt: record.lastLoginAt || existing.lastLoginAt || '',
});

const sanitizeSubAdmin = (record = {}, existing = {}) => ({
  id: record.id || existing.id || createId('subadmin'),
  name: String(record.name || existing.name || 'Sub Admin').trim(),
  email: normalizeEmail(record.email || existing.email),
  password: String(record.password || existing.password || '').trim(),
  role: String(record.role || existing.role || 'Manager').trim(),
  status: String(record.status || existing.status || 'Active').trim(),
  permissions: Array.from(
    new Set(
      (Array.isArray(record.permissions) ? record.permissions : existing.permissions || [])
        .map((item) => String(item).trim())
        .filter(Boolean),
    ),
  ),
  createdAt: record.createdAt || existing.createdAt || nowIso(),
  updatedAt: nowIso(),
  loginCount: Number(record.loginCount ?? existing.loginCount ?? 0),
  lastLoginAt: record.lastLoginAt || existing.lastLoginAt || '',
});

const sanitizeDistributor = (record = {}, existing = {}) => ({
  id: record.id || existing.id || createId('dist'),
  name: String(record.name || existing.name || 'Distributor').trim(),
  email: normalizeEmail(record.email || existing.email),
  password: String(record.password || existing.password || '').trim(),
  phone: String(record.phone || existing.phone || '').trim(),
  location: String(record.location || existing.location || '').trim(),
  status: String(record.status || existing.status || 'Active').trim(),
  totalOrders: Number(record.totalOrders ?? existing.totalOrders ?? 0),
  createdAt: record.createdAt || existing.createdAt || nowIso(),
  updatedAt: nowIso(),
  loginCount: Number(record.loginCount ?? existing.loginCount ?? 0),
  lastLoginAt: record.lastLoginAt || existing.lastLoginAt || '',
});

const sanitizeRetailer = (record = {}, existing = {}) => ({
  id: record.id || existing.id || createId('retailer'),
  name: String(record.name || existing.name || 'Retailer').trim(),
  email: normalizeEmail(record.email || existing.email),
  password: String(record.password || existing.password || '').trim(),
  phone: String(record.phone || existing.phone || '').trim(),
  location: String(record.location || existing.location || '').trim(),
  status: String(record.status || existing.status || 'Active').trim(),
  createdBy: normalizeEmail(record.createdBy || existing.createdBy),
  orderCount: Number(record.orderCount ?? existing.orderCount ?? 0),
  customerCount: Number(record.customerCount ?? existing.customerCount ?? 0),
  salesAmount: Number(record.salesAmount ?? existing.salesAmount ?? 0),
  createdAt: record.createdAt || existing.createdAt || nowIso(),
  updatedAt: nowIso(),
  loginCount: Number(record.loginCount ?? existing.loginCount ?? 0),
  lastLoginAt: record.lastLoginAt || existing.lastLoginAt || '',
});

const sanitizeInventoryProduct = (record = {}, existing = {}) => {
  const productName = String(record.name || record.product || existing.name || existing.product || '').trim();
  const quantity = Number.parseInt(record.quantity ?? record.availableQty ?? existing.quantity ?? existing.availableQty ?? 0, 10);
  const price = Number(record.price ?? existing.price ?? 0);
  const status = String(record.status || '').trim() || deriveInventoryStatus(quantity);

  return {
    id: record.id || existing.id || createId('inv'),
    name: productName,
    product: productName,
    category: String(record.category || existing.category || resolveCategory(productName)).trim(),
    price,
    priceLabel: formatCurrency(price),
    quantity,
    availableQty: quantity,
    status,
    sku: String(record.sku || existing.sku || createSku(productName)).trim(),
    createdAt: record.createdAt || existing.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
};

const sanitizeRegisteredProduct = (record = {}, existing = {}) => {
  const purchaseDate = String(record.purchaseDate || existing.purchaseDate || '').trim();
  const warrantyMonths = Number(record.warrantyMonths ?? existing.warrantyMonths ?? 12);
  const warranty = resolveWarrantySnapshot(purchaseDate, warrantyMonths);

  return {
    id: record.id || existing.id || createId('prd'),
    customerEmail: normalizeEmail(record.customerEmail || existing.customerEmail),
    customerName: String(record.customerName || existing.customerName || 'Customer').trim(),
    productName: String(record.productName || existing.productName || '').trim(),
    brand: String(record.brand || existing.brand || APP_NAME).trim(),
    modelNumber: String(record.modelNumber || existing.modelNumber || '').trim(),
    purchaseDate,
    warrantyMonths,
    invoiceName: String(record.invoiceName || existing.invoiceName || '').trim(),
    status: warranty.status,
    warrantyExpiryDate: warranty.expiryDate,
    createdAt: record.createdAt || existing.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
};

const sanitizeServiceRequest = (record = {}, existing = {}) => ({
  id: record.id || existing.id || `SR-${Date.now().toString().slice(-6)}`,
  customerEmail: normalizeEmail(record.customerEmail || existing.customerEmail),
  customerName: String(record.customerName || existing.customerName || 'Customer').trim(),
  customerPhone: String(record.customerPhone || existing.customerPhone || '').trim(),
  productId: String(record.productId || existing.productId || '').trim(),
  productName: String(record.productName || existing.productName || '').trim(),
  issueType: String(record.issueType || existing.issueType || 'Repair').trim(),
  description: String(record.description || existing.description || '').trim(),
  imageName: String(record.imageName || existing.imageName || '').trim(),
  status: String(record.status || existing.status || 'Pending').trim(),
  assignedTechnician: String(record.assignedTechnician || existing.assignedTechnician || 'Support Desk').trim(),
  createdAt: record.createdAt || existing.createdAt || nowIso(),
  updatedAt: record.updatedAt || existing.updatedAt || record.createdAt || nowIso(),
});

const buildDefaultDb = () => ({
  version: 1,
  admin: clone(DEFAULT_ADMIN),
  customers: [],
  subAdmins: [],
  distributors: [],
  retailers: [],
  inventoryProducts: DEFAULT_INVENTORY_ITEMS.map((item) => sanitizeInventoryProduct(item)),
  customerProducts: [],
  serviceRequests: [],
});

const mapLegacyCustomerProduct = (product, customer) =>
  sanitizeRegisteredProduct({
    id: product.id,
    customerEmail: customer.email,
    customerName: customer.name,
    productName: product.productName,
    brand: product.brand,
    modelNumber: product.modelNumber,
    purchaseDate: product.purchaseDate,
    warrantyMonths: product.warrantyMonths,
    invoiceName: product.invoiceName,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });

const mapLegacyServiceRequest = (request, customer) =>
  sanitizeServiceRequest({
    id: request.id,
    customerEmail: customer.email,
    customerName: customer.name,
    customerPhone: customer.phone || '',
    productId: request.productId,
    productName: request.productName,
    issueType: request.issueType,
    description: request.description,
    imageName: request.imageName,
    status: request.status,
    assignedTechnician: request.assignedTechnician,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  });

const buildSeedCustomerActivity = (customer) => {
  const productIdMap = new Map();

  const seededProducts = initialOwnedProducts.map((product) => {
    const id = createId('prd');
    productIdMap.set(product.id, id);

    return sanitizeRegisteredProduct({
      ...product,
      id,
      customerEmail: customer.email,
      customerName: customer.name,
    });
  });

  const seededRequests = initialServiceRequests.map((request) =>
    sanitizeServiceRequest({
      ...request,
      id: `SR-${Math.floor(1000 + Math.random() * 9000)}`,
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone || '',
      productId: productIdMap.get(request.productId) || seededProducts[0]?.id || '',
    }),
  );

  return {
    seededProducts,
    seededRequests,
  };
};

const ensureCustomerSeedData = (db, customer) => {
  const email = normalizeEmail(customer.email);

  if (!email) {
    return;
  }

  const hasProducts = db.customerProducts.some((item) => item.customerEmail === email);
  const hasRequests = db.serviceRequests.some((item) => item.customerEmail === email);

  if (hasProducts || hasRequests) {
    return;
  }

  const { seededProducts, seededRequests } = buildSeedCustomerActivity(customer);
  db.customerProducts = [...seededProducts, ...db.customerProducts];
  db.serviceRequests = [...seededRequests, ...db.serviceRequests];
};

const normalizeSavedDb = (value) => {
  const base = buildDefaultDb();
  const source = value && typeof value === 'object' ? value : {};

  const normalized = {
    version: 1,
    admin: {
      ...clone(DEFAULT_ADMIN),
      ...(source.admin && typeof source.admin === 'object' ? source.admin : {}),
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      role: 'admin',
      updatedAt: nowIso(),
    },
    customers: Array.isArray(source.customers)
      ? source.customers.map((item) => sanitizeCustomer(item)).filter((item) => item.email)
      : [],
    subAdmins: Array.isArray(source.subAdmins)
      ? source.subAdmins.map((item) => sanitizeSubAdmin(item)).filter((item) => item.email)
      : [],
    distributors: Array.isArray(source.distributors)
      ? source.distributors.map((item) => sanitizeDistributor(item)).filter((item) => item.email)
      : [],
    retailers: Array.isArray(source.retailers)
      ? source.retailers.map((item) => sanitizeRetailer(item)).filter((item) => item.email)
      : [],
    inventoryProducts: Array.isArray(source.inventoryProducts)
      ? source.inventoryProducts.map((item) => sanitizeInventoryProduct(item)).filter((item) => item.id)
      : [],
    customerProducts: Array.isArray(source.customerProducts)
      ? source.customerProducts.map((item) => sanitizeRegisteredProduct(item)).filter((item) => item.customerEmail)
      : [],
    serviceRequests: Array.isArray(source.serviceRequests)
      ? source.serviceRequests.map((item) => sanitizeServiceRequest(item)).filter((item) => item.customerEmail)
      : [],
  };

  if (normalized.inventoryProducts.length === 0) {
    normalized.inventoryProducts = base.inventoryProducts;
  }

  return normalized;
};

const applyLegacyAccounts = (db) => {
  const legacyAccounts = readJson(LEGACY_ACCOUNT_KEY, []);

  if (!Array.isArray(legacyAccounts) || legacyAccounts.length === 0) {
    return;
  }

  legacyAccounts.forEach((account) => {
    const email = normalizeEmail(account.email);

    if (!email) {
      return;
    }

    if (account.role === 'customer') {
      const existing = db.customers.find((item) => item.email === email);
      const customer = sanitizeCustomer(account, existing);

      if (existing) {
        Object.assign(existing, customer);
      } else {
        db.customers.unshift(customer);
      }

      ensureCustomerSeedData(db, customer);
      return;
    }

    if (account.role === 'subadmin') {
      const existing = db.subAdmins.find((item) => item.email === email);
      const subAdmin = sanitizeSubAdmin(account, existing);

      if (existing) {
        Object.assign(existing, subAdmin);
      } else {
        db.subAdmins.unshift(subAdmin);
      }

      return;
    }

    if (account.role === 'distributor') {
      const existing = db.distributors.find((item) => item.email === email);
      const distributor = sanitizeDistributor(account, existing);

      if (existing) {
        Object.assign(existing, distributor);
      } else {
        db.distributors.unshift(distributor);
      }

      return;
    }

    if (account.role === 'retailer') {
      const existing = db.retailers.find((item) => item.email === email);
      const retailer = sanitizeRetailer(account, existing);

      if (existing) {
        Object.assign(existing, retailer);
      } else {
        db.retailers.unshift(retailer);
      }
    }
  });
};

const applyLegacyCustomerData = (db) => {
  const rawCustomerData = readJson('customerData', null);
  const rawCustomerProfile = readJson('customerProfile', null);

  const email = normalizeEmail(rawCustomerProfile?.email || rawCustomerData?.email);
  const name = String(rawCustomerProfile?.fullName || rawCustomerData?.name || '').trim();
  const phone = String(rawCustomerProfile?.phone || rawCustomerData?.phone || '').trim();

  if (!email) {
    return;
  }

  const existing = db.customers.find((item) => item.email === email);
  const customer = sanitizeCustomer({ email, name, phone }, existing);

  if (existing) {
    Object.assign(existing, customer);
  } else {
    db.customers.unshift(customer);
  }

  const legacyProducts = readJson('customerOwnedProducts', []);
  if (
    Array.isArray(legacyProducts) &&
    legacyProducts.length > 0 &&
    !db.customerProducts.some((item) => item.customerEmail === email)
  ) {
    db.customerProducts = [
      ...legacyProducts.map((item) => mapLegacyCustomerProduct(item, customer)),
      ...db.customerProducts,
    ];
  }

  const legacyRequests = readJson('customerServiceRequests', []);
  if (
    Array.isArray(legacyRequests) &&
    legacyRequests.length > 0 &&
    !db.serviceRequests.some((item) => item.customerEmail === email)
  ) {
    db.serviceRequests = [
      ...legacyRequests.map((item) => mapLegacyServiceRequest(item, customer)),
      ...db.serviceRequests,
    ];
  }
};

const ensureDb = () => {
  const normalized = normalizeSavedDb(readJson(FRONTEND_DB_KEY, buildDefaultDb()));
  applyLegacyAccounts(normalized);
  applyLegacyCustomerData(normalized);
  writeJson(FRONTEND_DB_KEY, normalized);
  return normalized;
};

const mutateDb = (updater) => {
  const draft = clone(ensureDb());
  const result = updater(draft) || draft;
  const normalized = normalizeSavedDb(result);
  writeJson(FRONTEND_DB_KEY, normalized);
  return normalized;
};

const getDbSnapshot = () => clone(ensureDb());

const markLogin = (record) => ({
  ...record,
  loginCount: Number(record.loginCount || 0) + 1,
  lastLoginAt: nowIso(),
  updatedAt: nowIso(),
});

const verifyPassword = (record, password) => String(record?.password || '') === String(password || '');

const requireCredentials = (email, password, errorMessage) => {
  if (!normalizeEmail(email) || !String(password || '').trim()) {
    throw createAppError(errorMessage);
  }

  if (!hasAtSymbol(email)) {
    throw createAppError('Email must include @');
  }
};

const authenticateRecord = (collectionKey, email, password, options = {}) => {
  const normalizedEmail = normalizeEmail(email);

  requireCredentials(normalizedEmail, password, options.invalidMessage || 'Invalid email or password.');

  const updatedDb = mutateDb((db) => {
    const collection = db[collectionKey];
    const index = collection.findIndex((item) => item.email === normalizedEmail);

    if (index === -1) {
      throw createAppError(options.notFoundMessage || 'Account not found.', options.notFoundExtras || {});
    }

    const existing = collection[index];

    if (!verifyPassword(existing, password)) {
      throw createAppError(options.invalidMessage || 'Invalid email or password.', { status: 401 });
    }

    collection[index] = markLogin(existing);
  });

  return updatedDb[collectionKey].find((item) => item.email === normalizedEmail);
};

const upsertCustomer = (db, payload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const index = db.customers.findIndex((item) => item.email === normalizedEmail);
  const existing = index >= 0 ? db.customers[index] : null;
  const customer = sanitizeCustomer(payload, existing || {});

  if (index >= 0) {
    db.customers[index] = customer;
  } else {
    db.customers.unshift(customer);
  }

  return customer;
};

const upsertSubAdmin = (db, payload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const index = db.subAdmins.findIndex((item) => item.email === normalizedEmail);
  const existing = index >= 0 ? db.subAdmins[index] : null;
  const subAdmin = sanitizeSubAdmin(payload, existing || {});

  if (index >= 0) {
    db.subAdmins[index] = subAdmin;
  } else {
    db.subAdmins.unshift(subAdmin);
  }

  return subAdmin;
};

const upsertDistributor = (db, payload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const index = db.distributors.findIndex((item) => item.email === normalizedEmail);
  const existing = index >= 0 ? db.distributors[index] : null;
  const distributor = sanitizeDistributor(payload, existing || {});

  if (index >= 0) {
    db.distributors[index] = distributor;
  } else {
    db.distributors.unshift(distributor);
  }

  return distributor;
};

const upsertRetailer = (db, payload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const index = db.retailers.findIndex((item) => item.email === normalizedEmail);
  const existing = index >= 0 ? db.retailers[index] : null;
  const retailer = sanitizeRetailer(payload, existing || {});

  if (index >= 0) {
    db.retailers[index] = retailer;
  } else {
    db.retailers.unshift(retailer);
  }

  return retailer;
};

const countCustomerProducts = (db, email) =>
  db.customerProducts.filter((item) => item.customerEmail === normalizeEmail(email)).length;

const countCustomerServiceRequests = (db, email) =>
  db.serviceRequests.filter((item) => item.customerEmail === normalizeEmail(email)).length;

const getCustomerTier = (db, customer) => {
  const registeredProductsCount = countCustomerProducts(db, customer.email);
  const requestCount = countCustomerServiceRequests(db, customer.email);
  const engagement = Number(customer.loginCount || 0) + registeredProductsCount + requestCount;

  if (engagement >= 5 || registeredProductsCount >= 2) {
    return 'Premium';
  }

  if (engagement <= 1) {
    return 'New';
  }

  return 'Standard';
};

export const frontendDataStore = {
  createAppError,
  createId,
  getDbSnapshot,
  mutateDb,
  normalizeEmail,
  registerCustomer({ name, email, password }) {
    const normalizedEmail = normalizeEmail(email);

    if (!String(name || '').trim()) {
      throw createAppError('Full name is required.');
    }

    requireCredentials(normalizedEmail, password, 'Email and password are required.');

    const db = mutateDb((draft) => {
      if (draft.customers.some((item) => item.email === normalizedEmail)) {
        throw createAppError('An account with this email already exists.');
      }

      const customer = upsertCustomer(draft, {
        name,
        email: normalizedEmail,
        password,
      });

      ensureCustomerSeedData(draft, customer);
    });

    const customer = db.customers.find((item) => item.email === normalizedEmail);
    return { user: customer };
  },
  authenticateCustomer({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    requireCredentials(normalizedEmail, password, 'Email and password are required.');

    const db = mutateDb((draft) => {
      const customer = upsertCustomer(draft, {
        email: normalizedEmail,
        name: deriveNameFromEmail(normalizedEmail, 'Customer'),
        password,
      });

      const index = draft.customers.findIndex((item) => item.id === customer.id);
      draft.customers[index] = markLogin({
        ...customer,
        password,
      });
      ensureCustomerSeedData(draft, draft.customers[index]);
    });

    return { user: db.customers.find((item) => item.email === normalizedEmail) };
  },
  authenticateAdmin({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    requireCredentials(normalizedEmail, password, 'Email and password are required.');

    mutateDb((draft) => {
      draft.admin = markLogin({
        ...draft.admin,
      });
    });

    return {
      admin: {
        ...DEFAULT_ADMIN,
        name: deriveNameFromEmail(normalizedEmail, 'Admin User'),
        email: normalizedEmail,
        password,
      },
    };
  },
  authenticateSubAdmin({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    requireCredentials(normalizedEmail, password, 'Email and password are required.');

    const db = mutateDb((draft) => {
      const subAdmin = upsertSubAdmin(draft, {
        email: normalizedEmail,
        name: deriveNameFromEmail(normalizedEmail, 'Sub Admin'),
        password,
        role: 'Manager',
        status: 'Active',
        permissions: ['Inventory', 'Orders', 'Reports', 'Services'],
      });

      const index = draft.subAdmins.findIndex((item) => item.id === subAdmin.id);
      draft.subAdmins[index] = markLogin({
        ...subAdmin,
        password,
      });
    });

    return { subAdmin: db.subAdmins.find((item) => item.email === normalizedEmail) };
  },
  authenticateDistributor({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    requireCredentials(normalizedEmail, password, 'Email and password are required.');

    const db = mutateDb((draft) => {
      const distributor = upsertDistributor(draft, {
        email: normalizedEmail,
        name: deriveNameFromEmail(normalizedEmail, 'Distributor'),
        password,
        phone: '98765 43210',
        location: 'Mumbai',
        status: 'Active',
      });

      const index = draft.distributors.findIndex((item) => item.id === distributor.id);
      draft.distributors[index] = markLogin({
        ...distributor,
        password,
      });
    });

    return { distributor: db.distributors.find((item) => item.email === normalizedEmail) };
  },
  authenticateRetailer({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    requireCredentials(normalizedEmail, password, 'Email and password are required.');

    const db = mutateDb((draft) => {
      const retailer = upsertRetailer(draft, {
        email: normalizedEmail,
        name: deriveNameFromEmail(normalizedEmail, 'Retailer'),
        password,
        phone: '98765 43210',
        location: 'Mumbai',
        status: 'Active',
        orderCount: 0,
        customerCount: 0,
        salesAmount: 0,
      });

      const index = draft.retailers.findIndex((item) => item.id === retailer.id);
      draft.retailers[index] = markLogin({
        ...retailer,
        password,
      });
    });

    return { retailer: db.retailers.find((item) => item.email === normalizedEmail) };
  },
  listSubAdmins() {
    return {
      subAdmins: getDbSnapshot().subAdmins.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    };
  },
  createSubAdmin(payload) {
    const normalizedEmail = normalizeEmail(payload.email);

    if (!payload.name?.trim() || !normalizedEmail || !payload.password?.trim()) {
      throw createAppError('Please fill name, email, and password.');
    }

    if (!hasAtSymbol(normalizedEmail)) {
      throw createAppError('Email must include @');
    }

    const db = mutateDb((draft) => {
      if (draft.subAdmins.some((item) => item.email === normalizedEmail)) {
        throw createAppError('A sub admin with this email already exists.');
      }

      draft.subAdmins.unshift(
        sanitizeSubAdmin({
          ...payload,
          email: normalizedEmail,
        }),
      );
    });

    return { subAdmin: db.subAdmins.find((item) => item.email === normalizedEmail) };
  },
  removeSubAdmin(id) {
    mutateDb((draft) => {
      draft.subAdmins = draft.subAdmins.filter((item) => item.id !== id);
    });

    return { success: true };
  },
  listDistributors() {
    return {
      distributors: getDbSnapshot().distributors.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    };
  },
  createDistributor(payload) {
    const normalizedEmail = normalizeEmail(payload.email);

    if (!payload.name?.trim() || !normalizedEmail || !payload.password?.trim()) {
      throw createAppError('Please complete all distributor details.');
    }

    if (!hasAtSymbol(normalizedEmail)) {
      throw createAppError('Email must include @');
    }

    const db = mutateDb((draft) => {
      if (draft.distributors.some((item) => item.email === normalizedEmail)) {
        throw createAppError('A distributor with this email already exists.');
      }

      draft.distributors.unshift(
        sanitizeDistributor({
          ...payload,
          email: normalizedEmail,
        }),
      );
    });

    return { distributor: db.distributors.find((item) => item.email === normalizedEmail) };
  },
  updateDistributor(id, payload) {
    const db = mutateDb((draft) => {
      const index = draft.distributors.findIndex((item) => item.id === id);

      if (index === -1) {
        throw createAppError('Distributor not found.');
      }

      draft.distributors[index] = sanitizeDistributor(payload, draft.distributors[index]);
    });

    return { distributor: db.distributors.find((item) => item.id === id) };
  },
  removeDistributor(id) {
    mutateDb((draft) => {
      draft.distributors = draft.distributors.filter((item) => item.id !== id);
    });

    return { success: true };
  },
  listRetailers(createdBy = '') {
    const normalizedCreatedBy = normalizeEmail(createdBy);
    const db = getDbSnapshot();
    const retailers = db.retailers
      .filter((item) => !normalizedCreatedBy || item.createdBy === normalizedCreatedBy)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return { retailers };
  },
  createRetailer(payload) {
    const normalizedEmail = normalizeEmail(payload.email);

    if (!payload.name?.trim() || !normalizedEmail || !payload.password?.trim()) {
      throw createAppError('Please complete all retailer details.');
    }

    if (!hasAtSymbol(normalizedEmail)) {
      throw createAppError('Email must include @');
    }

    const db = mutateDb((draft) => {
      if (draft.retailers.some((item) => item.email === normalizedEmail)) {
        throw createAppError('A retailer with this email already exists.');
      }

      draft.retailers.unshift(
        sanitizeRetailer({
          ...payload,
          email: normalizedEmail,
        }),
      );
    });

    return { retailer: db.retailers.find((item) => item.email === normalizedEmail) };
  },
  updateRetailer(id, payload) {
    const db = mutateDb((draft) => {
      const index = draft.retailers.findIndex((item) => item.id === id);

      if (index === -1) {
        throw createAppError('Retailer not found.');
      }

      draft.retailers[index] = sanitizeRetailer(payload, draft.retailers[index]);
    });

    return { retailer: db.retailers.find((item) => item.id === id) };
  },
  removeRetailer(id, createdBy = '') {
    const normalizedCreatedBy = normalizeEmail(createdBy);

    mutateDb((draft) => {
      draft.retailers = draft.retailers.filter((item) => {
        if (item.id !== id) {
          return true;
        }

        if (normalizedCreatedBy && item.createdBy && item.createdBy !== normalizedCreatedBy) {
          throw createAppError('Retailer not found.');
        }

        return false;
      });
    });

    return { success: true };
  },
  listInventoryProducts() {
    return {
      inventoryProducts: getDbSnapshot().inventoryProducts.sort((left, right) => left.name.localeCompare(right.name)),
    };
  },
  createInventoryProduct(payload) {
    const db = mutateDb((draft) => {
      draft.inventoryProducts.unshift(sanitizeInventoryProduct(payload));
    });

    return { inventoryProduct: db.inventoryProducts[0] };
  },
  updateInventoryProduct(id, payload) {
    const db = mutateDb((draft) => {
      const index = draft.inventoryProducts.findIndex((item) => item.id === id);

      if (index === -1) {
        throw createAppError('Inventory product not found.');
      }

      draft.inventoryProducts[index] = sanitizeInventoryProduct(payload, draft.inventoryProducts[index]);
    });

    return { inventoryProduct: db.inventoryProducts.find((item) => item.id === id) };
  },
  removeInventoryProduct(id) {
    mutateDb((draft) => {
      draft.inventoryProducts = draft.inventoryProducts.filter((item) => item.id !== id);
    });

    return { success: true };
  },
  listCustomerProducts(customerEmail = '') {
    const normalizedEmail = normalizeEmail(customerEmail);
    const db = getDbSnapshot();
    const registeredProducts = db.customerProducts
      .filter((item) => !normalizedEmail || item.customerEmail === normalizedEmail)
      .map((item) => sanitizeRegisteredProduct(item, item))
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return { registeredProducts };
  },
  registerCustomerProduct(payload) {
    const normalizedEmail = normalizeEmail(payload.customerEmail);

    if (!normalizedEmail || !payload.customerName?.trim()) {
      throw createAppError('Please sign in again before registering a product.');
    }

    if (!payload.productName?.trim() || !payload.purchaseDate?.trim()) {
      throw createAppError('Please complete all required product fields.');
    }

    const db = mutateDb((draft) => {
      upsertCustomer(draft, {
        email: normalizedEmail,
        name: payload.customerName,
      });

      draft.customerProducts.unshift(
        sanitizeRegisteredProduct({
          ...payload,
          customerEmail: normalizedEmail,
        }),
      );
    });

    return { registeredProduct: db.customerProducts[0] };
  },
  listServiceRequests(customerEmail = '') {
    const normalizedEmail = normalizeEmail(customerEmail);
    const db = getDbSnapshot();
    const serviceRequests = db.serviceRequests
      .filter((item) => !normalizedEmail || item.customerEmail === normalizedEmail)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return { serviceRequests };
  },
  createServiceRequest(payload) {
    const normalizedEmail = normalizeEmail(payload.customerEmail);

    if (!normalizedEmail || !payload.customerName?.trim()) {
      throw createAppError('Please sign in again before raising a service request.');
    }

    if (!payload.productId?.trim() || !payload.description?.trim()) {
      throw createAppError('Please complete all required request fields.');
    }

    const db = mutateDb((draft) => {
      upsertCustomer(draft, {
        email: normalizedEmail,
        name: payload.customerName,
        phone: payload.customerPhone,
      });

      draft.serviceRequests.unshift(
        sanitizeServiceRequest({
          ...payload,
          customerEmail: normalizedEmail,
          status: payload.status || 'Pending',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }),
      );
    });

    return { serviceRequest: db.serviceRequests[0] };
  },
  listRetailerCustomers() {
    const db = getDbSnapshot();
    const customers = db.customers
      .filter((customer) => {
        const hasActivity =
          countCustomerProducts(db, customer.email) > 0 ||
          countCustomerServiceRequests(db, customer.email) > 0;

        return Number(customer.loginCount || 0) > 0 || hasActivity;
      })
      .map((customer) => ({
        name: customer.name,
        email: customer.email,
        orders: countCustomerProducts(db, customer.email),
        tier: getCustomerTier(db, customer),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    const premiumMembers = customers.filter((customer) => customer.tier === 'Premium').length;
    const newThisMonth = db.customers.filter((customer) => {
      const createdAt = new Date(customer.createdAt);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
    const repeatUsers = db.customers.filter((customer) => Number(customer.loginCount || 0) > 1).length;
    const repeatRate = customers.length ? `${Math.round((repeatUsers / customers.length) * 100)}%` : '0%';

    return {
      customers,
      stats: {
        activeCustomers: String(customers.length),
        premiumMembers: String(premiumMembers),
        newThisMonth: String(newThisMonth),
        repeatRate,
      },
    };
  },
  listLoggedInRetailers() {
    const db = getDbSnapshot();
    const retailers = db.retailers
      .filter((retailer) => Number(retailer.loginCount || 0) > 0)
      .map((retailer) => ({
        id: retailer.id,
        name: retailer.name,
        owner: retailer.name,
        location: retailer.location,
        contact: retailer.phone,
        sales: formatCurrency(retailer.salesAmount),
        orders: retailer.orderCount,
        customers: retailer.customerCount,
        joinDate: toDisplayDate(retailer.createdAt),
        status: retailer.status,
        email: retailer.email,
        loginCount: retailer.loginCount,
      }))
      .sort((left, right) => right.loginCount - left.loginCount);

    return { retailers };
  },
};
