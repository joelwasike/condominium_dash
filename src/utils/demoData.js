
export const isDemoMode = () => {
  return localStorage.getItem('demo_mode') === 'true';
};
const generateId = () => Math.floor(Math.random() * 10000) + 1;
const generateDate = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};
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
  { id: generateId(), date: generateDate(90), amount: 50000, status: 'Pending', method: 'Cash', reference: 'CS-' + generateId() }],

  maintenanceRequests: [
  { id: generateId(), title: 'Leaky Faucet', description: 'Kitchen faucet is leaking', status: 'In Progress', priority: 'Medium', date: generateDate(5) },
  { id: generateId(), title: 'AC Not Working', description: 'Air conditioning unit stopped working', status: 'Completed', priority: 'High', date: generateDate(15) }],

  transferRequests: [
  { id: generateId(), property: '123 Demo Street, Apartment 4B', newClient: 'Jane Relative', recipientName: 'Jane Relative', requestDate: generateDate(10), status: 'Pending' },
  { id: generateId(), property: '123 Demo Street, Apartment 4B', newClient: 'John Family', recipientName: 'John Family', requestDate: generateDate(45), status: 'Approved' }]

});
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
  { id: generateId(), address: '789 Test Road, House 5', type: 'House', status: 'Vacant', rent: 100000, tenant: null }],

  tenants: [
  { id: generateId(), name: 'John Doe', email: 'john@example.com', phone: '+226 70 12 34 56', property: '123 Demo Street', status: 'Active' },
  { id: generateId(), name: 'Jane Smith', email: 'jane@example.com', phone: '+226 70 23 45 67', property: '456 Sample Avenue', status: 'Active' }],

  payments: [
  { id: generateId(), date: generateDate(10), amount: 50000, tenant: 'John Doe', property: '123 Demo Street', status: 'Completed' },
  { id: generateId(), date: generateDate(20), amount: 75000, tenant: 'Jane Smith', property: '456 Sample Avenue', status: 'Completed' }],

  workOrders: [
  { id: generateId(), property: '123 Demo Street', type: 'Maintenance', status: 'In Progress', assignedTo: 'Tech Team', estimatedCost: 25000 },
  { id: generateId(), property: '456 Sample Avenue', type: 'Repair', status: 'Completed', assignedTo: 'Tech Team', estimatedCost: 15000 }],

  maintenances: [
  { id: generateId(), property: '123 Demo Street, Apartment 4B', tenant: 'John Doe', issue: 'Leaky faucet in kitchen', priority: 'Medium', status: 'Pending', assigned: 'Tech Team', date: generateDate(2), estimatedCost: 15000, company: 'Demo' },
  { id: generateId(), property: '456 Sample Avenue, Unit 2A', tenant: 'Jane Smith', issue: 'AC not cooling', priority: 'High', status: 'Approved', assigned: 'Tech Team', date: generateDate(5), estimatedCost: 25000, company: 'Demo' }],

  claims: [],
  inventory: [],
  rents: {
    totalCollected: 1250000,
    totalPending: 150000,
    collectedRents: [
    { id: generateId(), date: generateDate(5), tenant: 'John Doe', property: '123 Demo Street', amount: 50000, method: 'Mobile Money', status: 'Approved' },
    { id: generateId(), date: generateDate(35), tenant: 'Jane Smith', property: '456 Sample Avenue', amount: 75000, method: 'Bank Transfer', status: 'Approved' }],

    pendingRents: [
    { id: generateId(), tenant: 'Pierre Dupont', property: '789 Test Road', amount: 50000, status: 'Overdue', date: generateDate(25), daysOverdue: 25 },
    { id: generateId(), tenant: 'Marie Martin', property: '101 Demo Building', amount: 60000, status: 'Pending', date: generateDate(5), daysOverdue: 5 }]

  },
  businessTracking: {
    revenueTrends: '+10%',
    occupancyRate: 80,
    maintenanceCosts: 240000,
    roi: 8.5,
    totalRevenue: 3000000,
    netProfit: 2760000,
    revenueByMonth: [
    { month: 'Sep', revenue: 450000 },
    { month: 'Oct', revenue: 500000 },
    { month: 'Nov', revenue: 480000 },
    { month: 'Dec', revenue: 520000 },
    { month: 'Jan', revenue: 500000 },
    { month: 'Feb', revenue: 550000 }],

    expensesByMonth: [
    { month: 'Sep', expenses: 38000 },
    { month: 'Oct', expenses: 42000 },
    { month: 'Nov', expenses: 35000 },
    { month: 'Dec', expenses: 45000 },
    { month: 'Jan', expenses: 40000 },
    { month: 'Feb', expenses: 40000 }],

    occupancyByMonth: [
    { month: 'Sep', rate: 75 },
    { month: 'Oct', rate: 78 },
    { month: 'Nov', rate: 80 },
    { month: 'Dec', rate: 80 },
    { month: 'Jan', rate: 82 },
    { month: 'Feb', rate: 80 }]

  },
  expenses: []
});
export const getSalesManagerDemoData = () => {
  const ownerOneId = generateId();
  const ownerTwoId = generateId();

  const properties = [
  { id: generateId(), address: '123 Demo Street, Apartment 4B', type: 'Apartment', status: 'Occupied', rent: 50000, bedrooms: 2, bathrooms: 1.5, landlordId: ownerOneId },
  { id: generateId(), address: '456 Sample Avenue, Unit 2A', type: 'Condo', status: 'Occupied', rent: 75000, bedrooms: 3, bathrooms: 2, landlordId: ownerTwoId },
  { id: generateId(), address: '789 Test Road, House 5', type: 'House', status: 'Vacant', rent: 100000, bedrooms: 4, bathrooms: 3, landlordId: ownerOneId }];


  const salesProperties = [
  { id: generateId(), address: '15 Palm Grove, Villa 3', type: 'Villa', bedrooms: 4, bathrooms: 3.5, price: '250,000,000 XOF', status: 'Published' },
  { id: generateId(), address: 'Sunset Heights, Apartment 12A', type: 'Apartment', bedrooms: 3, bathrooms: 2, price: '95,000,000 XOF', status: 'Published' },
  { id: generateId(), address: 'Green Meadows, Plot 24', type: 'Land', bedrooms: 0, bathrooms: 0, price: '45,000,000 XOF', status: 'Published' },
  { id: generateId(), address: 'City Center, House 9', type: 'House', bedrooms: 5, bathrooms: 4, price: '180,000,000 XOF', status: 'Draft' }];


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
    { id: generateId(), name: 'Jane Smith', email: 'jane@example.com', phone: '+226 70 23 45 67', property: '456 Sample Avenue', amount: 75000, status: 'Active' }],

    waitingListClients: [
    { id: generateId(), name: 'Bob Johnson', email: 'bob@example.com', phone: '+226 70 34 56 78', preferredProperty: '789 Test Road' }],

    unpaidRents: [
    { id: generateId(), name: 'Alice Brown', email: 'alice@example.com', property: '321 Demo Lane', amount: 50000, daysOverdue: 15 }],

    alerts: [
    { id: generateId(), title: 'Payment Overdue', message: 'Alice Brown has overdue payment', type: 'warning', date: generateDate(2) }],

    owners: [
    { id: ownerOneId, name: 'Owner One', email: 'owner1@example.com', phone: '+226 70 11 11 11', propertiesCount: 2 },
    { id: ownerTwoId, name: 'Owner Two', email: 'owner2@example.com', phone: '+226 70 22 22 22', propertiesCount: 1 }],

    salesProperties
  };
};
export const getAccountingDemoData = () => ({
  overview: {
    totalCollectedThisMonth: 2500000,
    totalExpensesThisMonth: 500000,
    netProfitThisMonth: 2000000,
    totalTenantPayments: 15,
    totalLandlordPayments: 8,
    totalAvailableBalance: 1850000,
    globalBalance: 1850000,
    totalTransferredToLandlords: 2000000,
    totalCompanyCommissionEarned: 250000,
    pendingRentAmount: 150000
  },
  tenantPayments: [
  { id: generateId(), tenant: 'John Doe', property: '123 Demo Street', amount: 50000, date: generateDate(5), method: 'Mobile Money', Status: 'Approved' },
  { id: generateId(), tenant: 'Jane Smith', property: '456 Sample Avenue', amount: 75000, date: generateDate(10), method: 'Bank Transfer', Status: 'Approved' }],

  landlordPayments: [
  { id: generateId(), landlord: 'Owner One', property: '123 Demo Street', amount: 40000, date: generateDate(7), status: 'Completed' },
  { id: generateId(), landlord: 'Owner Two', property: '456 Sample Avenue', amount: 60000, date: generateDate(12), status: 'Completed' }],

  collections: [
  { ID: generateId(), Building: '123 Demo Street', Landlord: 'Owner One', Amount: 50000, Status: 'Collected', Date: generateDate(5), ChargeType: 'Rent' },
  { ID: generateId(), Building: '456 Sample Avenue', Landlord: 'Owner Two', Amount: 75000, Status: 'Collected', Date: generateDate(10), ChargeType: 'Rent' },
  { ID: generateId(), Building: '123 Demo Street', Landlord: 'Owner One', Amount: 100000, Status: 'Collected', Date: generateDate(3), ChargeType: 'Deposit' },
  { ID: generateId(), Building: '789 Test Road', Landlord: 'Owner One', Amount: 50000, Status: 'Pending', Date: generateDate(2), ChargeType: 'Rent' }],

  expenses: [
  { id: generateId(), category: 'Maintenance', amount: 150000, date: generateDate(3), property: '123 Demo Street', description: 'Plumbing repair' },
  { id: generateId(), category: 'Utilities', amount: 100000, date: generateDate(8), property: '456 Sample Avenue', description: 'Electricity bill' }],

  monthlySummary: {
    collections: 2500000,
    expenses: 500000,
    netProfit: 2000000
  },
  landlords: [
  { id: generateId(), name: 'Owner One', email: 'owner1@example.com', totalProperties: 3 },
  { id: generateId(), name: 'Owner Two', email: 'owner2@example.com', totalProperties: 2 }],

  advertisements: [
  { ID: generateId(), Title: 'Demo Campaign', Text: 'Welcome to the Accounting Dashboard. Manage your financial operations efficiently.', imageUrl: null, CreatedAt: new Date().toISOString() }]

});
export const getAgencyDirectorDemoData = () => {
  const ownerOneId = generateId();
  const ownerTwoId = generateId();
  const prop1Id = generateId();
  const prop2Id = generateId();
  return {
    overview: {
      totalRentCollected: 5000000,
      occupancyRate: 75,
      totalProperties: 20,
      totalUsers: 8
    },
    users: [
    { id: generateId(), name: 'Sales Manager One', email: 'sales1@example.com', role: 'salesmanager', status: 'Active' },
    { id: generateId(), name: 'Accounting User', email: 'accounting@example.com', role: 'accounting', status: 'Active' }],

    properties: [
    { id: prop1Id, address: '123 Demo Street, Apartment 4B', type: 'Apartment', status: 'Occupied', rent: 50000, tenant: 'John Doe', landlordId: ownerOneId, LandlordID: ownerOneId, units: [{ unitNumber: '4B', rent: 50000, tenant: 'John Doe', status: 'Occupied' }] },
    { id: prop2Id, address: '456 Sample Avenue, Unit 2A', type: 'Condo', status: 'Occupied', rent: 75000, tenant: 'Jane Smith', landlordId: ownerOneId, LandlordID: ownerOneId, units: [{ unitNumber: '2A', rent: 75000, tenant: 'Jane Smith', status: 'Occupied' }] }],

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
    { id: generateId(), landlord: 'Owner One', amount: 40000, date: generateDate(5), status: 'Completed' }],

    subscriptionInfo: {
      status: 'Active',
      plan: 'Premium',
      nextBillingDate: generateDate(-25)
    },
    owners: [
    { id: ownerOneId, name: 'Owner One', email: 'owner1@example.com', propertiesCount: 2, contractsCount: 3, status: 'Active', totalOfAssets: 2, propertyForSell: 0, propertyForManage: 2, occupancy: '2/2', incomeThisMonth: 125000 },
    { id: ownerTwoId, name: 'Owner Two', email: 'owner2@example.com', propertiesCount: 0, contractsCount: 2, status: 'Active', totalOfAssets: 0, propertyForSell: 0, propertyForManage: 0, occupancy: '0/0', incomeThisMonth: 0 }],

    pendingQuotes: [
    {
      id: generateId(),
      property: '123 Demo Street, Apartment 4B',
      tenant: 'John Doe',
      issue: 'Leaky faucet in kitchen',
      amount: 15000,
      date: generateDate(2),
      status: 'Pending',
      validatedBy: '—',
      approvedBy: '—'
    }],

    quoteRequests: [
    {
      id: generateId(),
      property: '456 Sample Avenue, Unit 2A',
      tenant: 'Jane Smith',
      issue: 'AC not cooling',
      amount: 25000,
      date: generateDate(5),
      status: 'approved',
      directorDecision: 'approved',
      directorDecisionReason: 'Reviewed the scope and confirmed the repair is necessary.',
      directorDecisionBy: 'Agency Director',
      directorDecisionAt: generateDate(4),
      validatedBy: 'Agency Director',
      approvedBy: '—',
      documents: [
      { name: 'Contractor quotation', url: 'https://example.com/demo-quotes/ac-quotation.pdf' },
      { name: 'Repair invoice', url: 'https://example.com/demo-quotes/ac-invoice.pdf' }],

      maintenance: {
        issue: 'AC not cooling',
        photos: [
        'https://example.com/demo-quotes/ac-photo-1.jpg',
        'https://example.com/demo-quotes/ac-photo-2.jpg']

      }
    },
    {
      id: generateId(),
      property: '789 Test Road, House 5',
      tenant: 'Paul Brown',
      issue: 'Broken window lock',
      amount: 12000,
      date: generateDate(8),
      status: 'rejected',
      directorDecision: 'rejected',
      directorDecisionReason: 'Quote was above the expected maintenance budget.',
      directorDecisionBy: 'Agency Director',
      directorDecisionAt: generateDate(7),
      validatedBy: '—',
      approvedBy: '—',
      documents: [
      { name: 'Rejection quote', url: 'https://example.com/demo-quotes/window-lock-quote.pdf' }],

      maintenance: {
        issue: 'Broken window lock',
        photos: [
        'https://example.com/demo-quotes/window-lock-photo.jpg']

      }
    }],

    conversations: []
  };
};
export const getCommercialDemoData = () => ({
  overview: {
    totalListings: 15,
    activeListings: 12,
    scheduledVisits: 8,
    interestedClients: 20
  },
  listings: [
  { id: generateId(), address: '123 Demo Street', type: 'Apartment', status: 'Available', price: 50000, bedrooms: 2, bathrooms: 1.5 },
  { id: generateId(), address: '456 Sample Avenue', type: 'Condo', status: 'Available', price: 75000, bedrooms: 3, bathrooms: 2 }],

  visits: {
    upcoming: [
    { id: generateId(), property: '123 Demo Street', client: 'John Doe', date: generateDate(-2), status: 'Scheduled' }],

    done: [
    { id: generateId(), property: '456 Sample Avenue', client: 'Jane Smith', date: generateDate(10), status: 'Completed' }],

    all: []
  },
  requests: [
  { id: generateId(), property: '123 Demo Street', client: 'John Doe', type: 'Viewing', status: 'Pending', date: generateDate(3) }],

  interestedClients: {
    clients: [
    { id: generateId(), name: 'John Doe', email: 'john@example.com', phone: '+226 70 12 34 56', interestedIn: '123 Demo Street' }]

  }
});
export const getTechnicianDemoData = () => ({
  overview: {
    totalTasks: 15,
    pendingTasks: 5,
    inProgressTasks: 3,
    completedTasks: 7
  },
  tasks: [
  { id: generateId(), property: '123 Demo Street', type: 'Maintenance', priority: 'High', status: 'Pending', assigned: 'Tech One', estimatedHours: 4 },
  { id: generateId(), property: '456 Sample Avenue', type: 'Repair', priority: 'Medium', status: 'In Progress', assigned: 'Tech Two', estimatedHours: 2 }],

  inspections: [
  { id: generateId(), property: '123 Demo Street', type: 'Move-in', inspector: 'Inspector One', date: generateDate(5), status: 'Completed' }]

});
export const getAdministrativeDemoData = () => ({
  overview: {
    totalContracts: 25,
    pendingContracts: 5,
    totalPayments: 1500000,
    pendingPayments: 200000
  },
  contracts: [
  { id: generateId(), tenant: 'John Doe', property: '123 Demo Street', status: 'Pending', date: generateDate(3) }],

  payments: [
  { id: generateId(), tenant: 'Jane Smith', property: '456 Sample Avenue', amount: 75000, status: 'Pending', date: generateDate(2) }]

});
export const getSuperAdminDemoData = () => ({
  overview: {
    totalAgencies: 10,
    activeAgencies: 8,
    totalTransactions: 50000000,
    monthlyRevenue: 5000000
  },
  agencies: [
  { id: generateId(), name: 'Demo Agency One', email: 'agency1@example.com', status: 'Active', totalProperties: 15 },
  { id: generateId(), name: 'Demo Agency Two', email: 'agency2@example.com', status: 'Active', totalProperties: 20 }],

  transactions: [
  { id: generateId(), agency: 'Demo Agency One', amount: 500000, date: generateDate(5), status: 'Completed', type: 'Subscription' }]

});
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
