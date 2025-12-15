// Demo data utility for all dashboards
// This provides realistic dummy data when in demo mode

export const isDemoMode = () => {
  return localStorage.getItem('demo_mode') === 'true';
};

// Common demo data generators
const generateId = () => Math.floor(Math.random() * 10000) + 1;
const generateDate = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Tenant Dashboard Demo Data
export const getTenantDemoData = () => ({
  overview: {
    totalPaid: 450000,
    totalDue: 50000,
    nextPaymentDate: generateDate(-5),
    nextPaymentAmount: 50000,
    leaseEndDate: generateDate(-180),
    propertyAddress: '123 Demo Street, Apartment 4B',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1.5
  },
  leaseInfo: {
    startDate: generateDate(-365),
    endDate: generateDate(-180),
    monthlyRent: 50000,
    deposit: 100000,
    status: 'Active'
  },
  payments: [
    { id: generateId(), date: generateDate(30), amount: 50000, status: 'Completed', method: 'Mobile Money', reference: 'MM-' + generateId() },
    { id: generateId(), date: generateDate(60), amount: 50000, status: 'Completed', method: 'Bank Transfer', reference: 'BT-' + generateId() },
    { id: generateId(), date: generateDate(90), amount: 50000, status: 'Pending', method: 'Cash', reference: 'CS-' + generateId() }
  ],
  maintenanceRequests: [
    { id: generateId(), title: 'Leaky Faucet', description: 'Kitchen faucet is leaking', status: 'In Progress', priority: 'Medium', date: generateDate(5) },
    { id: generateId(), title: 'AC Not Working', description: 'Air conditioning unit stopped working', status: 'Completed', priority: 'High', date: generateDate(15) }
  ]
});

// Landlord Dashboard Demo Data
export const getLandlordDemoData = () => ({
  overview: {
    totalRentCollected: 1500000,
    totalNetPayoutReceived: 1200000,
    totalProperties: 5,
    occupiedProperties: 4,
    vacantProperties: 1,
    totalTenants: 4
  },
  properties: [
    { id: generateId(), address: '123 Demo Street, Apartment 4B', type: 'Apartment', status: 'Occupied', rent: 50000, tenant: 'John Doe' },
    { id: generateId(), address: '456 Sample Avenue, Unit 2A', type: 'Condo', status: 'Occupied', rent: 75000, tenant: 'Jane Smith' },
    { id: generateId(), address: '789 Test Road, House 5', type: 'House', status: 'Vacant', rent: 100000, tenant: null }
  ],
  tenants: [
    { id: generateId(), name: 'John Doe', email: 'john@example.com', phone: '+226 70 12 34 56', property: '123 Demo Street', status: 'Active' },
    { id: generateId(), name: 'Jane Smith', email: 'jane@example.com', phone: '+226 70 23 45 67', property: '456 Sample Avenue', status: 'Active' }
  ],
  payments: [
    { id: generateId(), date: generateDate(10), amount: 50000, tenant: 'John Doe', property: '123 Demo Street', status: 'Completed' },
    { id: generateId(), date: generateDate(20), amount: 75000, tenant: 'Jane Smith', property: '456 Sample Avenue', status: 'Completed' }
  ],
  workOrders: [
    { id: generateId(), property: '123 Demo Street', type: 'Maintenance', status: 'In Progress', assignedTo: 'Tech Team', estimatedCost: 25000 },
    { id: generateId(), property: '456 Sample Avenue', type: 'Repair', status: 'Completed', assignedTo: 'Tech Team', estimatedCost: 15000 }
  ],
  claims: [],
  inventory: [],
  businessTracking: {
    monthlyRent: [450000, 500000, 480000, 520000, 500000, 550000],
    netPayout: [360000, 400000, 384000, 416000, 400000, 440000]
  },
  expenses: []
});

// Sales Manager Dashboard Demo Data
export const getSalesManagerDemoData = () => {
  const ownerOneId = generateId();
  const ownerTwoId = generateId();

  const properties = [
    { id: generateId(), address: '123 Demo Street, Apartment 4B', type: 'Apartment', status: 'Occupied', rent: 50000, bedrooms: 2, bathrooms: 1.5, landlordId: ownerOneId },
    { id: generateId(), address: '456 Sample Avenue, Unit 2A', type: 'Condo', status: 'Occupied', rent: 75000, bedrooms: 3, bathrooms: 2, landlordId: ownerTwoId },
    { id: generateId(), address: '789 Test Road, House 5', type: 'House', status: 'Vacant', rent: 100000, bedrooms: 4, bathrooms: 3, landlordId: ownerOneId }
  ];

  const salesProperties = [
    { id: generateId(), address: '15 Palm Grove, Villa 3', type: 'Villa', bedrooms: 4, bathrooms: 3.5, price: '250,000,000 XOF', status: 'Published' },
    { id: generateId(), address: 'Sunset Heights, Apartment 12A', type: 'Apartment', bedrooms: 3, bathrooms: 2, price: '95,000,000 XOF', status: 'Published' },
    { id: generateId(), address: 'Green Meadows, Plot 24', type: 'Land', bedrooms: 0, bathrooms: 0, price: '45,000,000 XOF', status: 'Published' },
    { id: generateId(), address: 'City Center, House 9', type: 'House', bedrooms: 5, bathrooms: 4, price: '180,000,000 XOF', status: 'Draft' }
  ];

  return {
    overview: {
      totalProperties: 12,
      occupiedProperties: 8,
      vacantProperties: 4,
      totalClients: 25,
      waitingListClients: 5,
      unpaidRents: 2
    },
    properties,
    clients: [
      { id: generateId(), name: 'John Doe', email: 'john@example.com', phone: '+226 70 12 34 56', property: '123 Demo Street', amount: 50000, status: 'Active' },
      { id: generateId(), name: 'Jane Smith', email: 'jane@example.com', phone: '+226 70 23 45 67', property: '456 Sample Avenue', amount: 75000, status: 'Active' }
    ],
    waitingListClients: [
      { id: generateId(), name: 'Bob Johnson', email: 'bob@example.com', phone: '+226 70 34 56 78', preferredProperty: '789 Test Road' }
    ],
    unpaidRents: [
      { id: generateId(), name: 'Alice Brown', email: 'alice@example.com', property: '321 Demo Lane', amount: 50000, daysOverdue: 15 }
    ],
    alerts: [
      { id: generateId(), title: 'Payment Overdue', message: 'Alice Brown has overdue payment', type: 'warning', date: generateDate(2) }
    ],
    owners: [
      { id: ownerOneId, name: 'Owner One', email: 'owner1@example.com', phone: '+226 70 11 11 11', propertiesCount: 2 },
      { id: ownerTwoId, name: 'Owner Two', email: 'owner2@example.com', phone: '+226 70 22 22 22', propertiesCount: 1 }
    ],
    salesProperties
  };
};

// Accounting Dashboard Demo Data
export const getAccountingDemoData = () => ({
  overview: {
    totalCollectedThisMonth: 2500000,
    totalExpensesThisMonth: 500000,
    netProfitThisMonth: 2000000,
    totalTenantPayments: 15,
    totalLandlordPayments: 8
  },
  tenantPayments: [
    { id: generateId(), tenant: 'John Doe', property: '123 Demo Street', amount: 50000, date: generateDate(5), method: 'Mobile Money', status: 'Completed' },
    { id: generateId(), tenant: 'Jane Smith', property: '456 Sample Avenue', amount: 75000, date: generateDate(10), method: 'Bank Transfer', status: 'Completed' }
  ],
  landlordPayments: [
    { id: generateId(), landlord: 'Owner One', property: '123 Demo Street', amount: 40000, date: generateDate(7), status: 'Completed' },
    { id: generateId(), landlord: 'Owner Two', property: '456 Sample Avenue', amount: 60000, date: generateDate(12), status: 'Completed' }
  ],
  collections: [
    { month: 'Jan', amount: 2000000 },
    { month: 'Feb', amount: 2200000 },
    { month: 'Mar', amount: 2400000 },
    { month: 'Apr', amount: 2300000 },
    { month: 'May', amount: 2500000 },
    { month: 'Jun', amount: 2500000 }
  ],
  expenses: [
    { id: generateId(), category: 'Maintenance', amount: 150000, date: generateDate(3), property: '123 Demo Street', description: 'Plumbing repair' },
    { id: generateId(), category: 'Utilities', amount: 100000, date: generateDate(8), property: '456 Sample Avenue', description: 'Electricity bill' }
  ],
  monthlySummary: {
    collections: 2500000,
    expenses: 500000,
    netProfit: 2000000
  },
  landlords: [
    { id: generateId(), name: 'Owner One', email: 'owner1@example.com', totalProperties: 3 },
    { id: generateId(), name: 'Owner Two', email: 'owner2@example.com', totalProperties: 2 }
  ]
});

// Agency Director Dashboard Demo Data
export const getAgencyDirectorDemoData = () => ({
  overview: {
    totalRentCollected: 5000000,
    occupancyRate: 75,
    totalProperties: 20,
    totalUsers: 8
  },
  users: [
    { id: generateId(), name: 'Sales Manager One', email: 'sales1@example.com', role: 'salesmanager', status: 'Active' },
    { id: generateId(), name: 'Accounting User', email: 'accounting@example.com', role: 'accounting', status: 'Active' }
  ],
  properties: [
    { id: generateId(), address: '123 Demo Street, Apartment 4B', type: 'Apartment', status: 'Occupied', rent: 50000, tenant: 'John Doe' },
    { id: generateId(), address: '456 Sample Avenue, Unit 2A', type: 'Condo', status: 'Occupied', rent: 75000, tenant: 'Jane Smith' }
  ],
  financial: {
    totalRevenue: 5000000,
    totalExpenses: 1000000,
    netProfit: 4000000
  },
  accounting: {
    collections: 2500000,
    expenses: 500000
  },
  landlordPayments: [
    { id: generateId(), landlord: 'Owner One', amount: 40000, date: generateDate(5), status: 'Completed' }
  ],
  subscriptionInfo: {
    status: 'Active',
    plan: 'Premium',
    nextBillingDate: generateDate(-25)
  },
  owners: [
    { id: generateId(), name: 'Owner One', email: 'owner1@example.com', propertiesCount: 3, contractsCount: 3, status: 'Active' },
    { id: generateId(), name: 'Owner Two', email: 'owner2@example.com', propertiesCount: 2, contractsCount: 2, status: 'Active' }
  ],
  conversations: []
});

// Commercial/Sales Dashboard Demo Data
export const getCommercialDemoData = () => ({
  overview: {
    totalListings: 15,
    activeListings: 12,
    scheduledVisits: 8,
    interestedClients: 20
  },
  listings: [
    { id: generateId(), address: '123 Demo Street', type: 'Apartment', status: 'Available', price: 50000, bedrooms: 2, bathrooms: 1.5 },
    { id: generateId(), address: '456 Sample Avenue', type: 'Condo', status: 'Available', price: 75000, bedrooms: 3, bathrooms: 2 }
  ],
  visits: {
    upcoming: [
      { id: generateId(), property: '123 Demo Street', client: 'John Doe', date: generateDate(-2), status: 'Scheduled' }
    ],
    done: [
      { id: generateId(), property: '456 Sample Avenue', client: 'Jane Smith', date: generateDate(10), status: 'Completed' }
    ],
    all: []
  },
  requests: [
    { id: generateId(), property: '123 Demo Street', client: 'John Doe', type: 'Viewing', status: 'Pending', date: generateDate(3) }
  ],
  interestedClients: {
    clients: [
      { id: generateId(), name: 'John Doe', email: 'john@example.com', phone: '+226 70 12 34 56', interestedIn: '123 Demo Street' }
    ]
  }
});

// Technician Dashboard Demo Data
export const getTechnicianDemoData = () => ({
  overview: {
    totalTasks: 15,
    pendingTasks: 5,
    inProgressTasks: 3,
    completedTasks: 7
  },
  tasks: [
    { id: generateId(), property: '123 Demo Street', type: 'Maintenance', priority: 'High', status: 'Pending', assigned: 'Tech One', estimatedHours: 4 },
    { id: generateId(), property: '456 Sample Avenue', type: 'Repair', priority: 'Medium', status: 'In Progress', assigned: 'Tech Two', estimatedHours: 2 }
  ],
  inspections: [
    { id: generateId(), property: '123 Demo Street', type: 'Move-in', inspector: 'Inspector One', date: generateDate(5), status: 'Completed' }
  ]
});

// Administrative Dashboard Demo Data
export const getAdministrativeDemoData = () => ({
  overview: {
    totalContracts: 25,
    pendingContracts: 5,
    totalPayments: 1500000,
    pendingPayments: 200000
  },
  contracts: [
    { id: generateId(), tenant: 'John Doe', property: '123 Demo Street', status: 'Pending', date: generateDate(3) }
  ],
  payments: [
    { id: generateId(), tenant: 'Jane Smith', property: '456 Sample Avenue', amount: 75000, status: 'Pending', date: generateDate(2) }
  ]
});

// Super Admin Dashboard Demo Data
export const getSuperAdminDemoData = () => ({
  overview: {
    totalAgencies: 10,
    activeAgencies: 8,
    totalTransactions: 50000000,
    monthlyRevenue: 5000000
  },
  agencies: [
    { id: generateId(), name: 'Demo Agency One', email: 'agency1@example.com', status: 'Active', totalProperties: 15 },
    { id: generateId(), name: 'Demo Agency Two', email: 'agency2@example.com', status: 'Active', totalProperties: 20 }
  ],
  transactions: [
    { id: generateId(), agency: 'Demo Agency One', amount: 500000, date: generateDate(5), status: 'Completed', type: 'Subscription' }
  ]
});

// Helper function to get demo data based on role
export const getDemoDataForRole = (role) => {
  switch (role) {
    case 'tenant':
      return getTenantDemoData();
    case 'landlord':
      return getLandlordDemoData();
    case 'salesmanager':
      return getSalesManagerDemoData();
    case 'accounting':
      return getAccountingDemoData();
    case 'agency_director':
      return getAgencyDirectorDemoData();
    case 'commercial':
      return getCommercialDemoData();
    case 'technician':
      return getTechnicianDemoData();
    case 'admin':
      return getAdministrativeDemoData();
    case 'superadmin':
      return getSuperAdminDemoData();
    default:
      return {};
  }
};

