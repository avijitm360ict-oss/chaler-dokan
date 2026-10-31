// API Client for চালের দোকান SaaS Platform
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'))
    ? 'https://chal-a-dokan-backend.onrender.com/api/v1'
    : 'http://localhost:4000/api/v1');

class ApiClient {
  private baseUrl: string;
  private tenantId: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.tenantId = localStorage.getItem('chal_tenant_id') || 'tenant-demo-001';
    this.token = localStorage.getItem('chal_auth_token') || null;
  }

  setTenantId(id: string) {
    this.tenantId = id;
    localStorage.setItem('chal_tenant_id', id);
  }

  getTenantId(): string {
    return this.tenantId;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('chal_auth_token', token);
    } else {
      localStorage.removeItem('chal_auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message?: string }> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.tenantId,
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.message || `সার্ভার ত্রুটি: ${response.status}`);
      }
      return json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('সার্ভারে যোগাযোগ করতে সময় বেশি লাগছে (Timeout)');
      }
      throw err;
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const healthUrl = this.baseUrl.replace('/api/v1', '/api/health');
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      return data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  // 0. Authentication
  auth = {
    login: (data: { phone: string; password: string }) =>
      this.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: {
      shopName: string;
      ownerName: string;
      phone: string;
      password: string;
      address?: string;
    }) =>
      this.request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    demo: (role: string = 'owner') =>
      this.request<any>('/auth/demo', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    getMe: () => this.request<any>('/auth/me'),
  };

  // 1. Products
  products = {
    getAll: () => this.request<any[]>('/products'),
    create: (data: any) =>
      this.request<any>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    archive: (id: string) =>
      this.request<any>(`/products/${id}`, {
        method: 'DELETE',
      }),
  };

  // 2. Market Rates
  marketRates = {
    getBoard: () => this.request<any[]>('/market-rates'),
    updateBulk: (
      rates: {
        productId: string;
        unitId: string;
        priceType: 'wholesale' | 'retail';
        newPricePaisa: number;
      }[]
    ) =>
      this.request<any>('/market-rates/bulk', {
        method: 'POST',
        body: JSON.stringify({ rates }),
      }),
  };

  // 3. Sales & POS
  sales = {
    create: (data: any) =>
      this.request<any>('/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: (params?: { page?: number; limit?: number }) => {
      const query = params ? `?page=${params.page || 1}&limit=${params.limit || 50}` : '';
      return this.request<any[]>(`/sales${query}`);
    },
    voidInvoice: (id: string, reason: string) =>
      this.request<any>(`/sales/${id}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  };

  // 4. Purchases
  purchases = {
    create: (data: any) =>
      this.request<any>('/purchases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: () => this.request<any[]>('/purchases'),
  };

  // 5. Inventory & Stock
  inventory = {
    getBalances: () => this.request<any[]>('/inventory/balances'),
    getMovements: (productId?: string) => {
      const query = productId ? `?productId=${productId}` : '';
      return this.request<any[]>(`/inventory/movements${query}`);
    },
    adjust: (data: {
      productId: string;
      warehouseId: string;
      diffKg: number;
      reason: string;
    }) =>
      this.request<any>('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTimeline: (productId: string) =>
      this.request<any>(`/inventory/timeline/${productId}`),
    transfer: (data: {
      fromWarehouseId: string;
      toWarehouseId: string;
      productId: string;
      qtyKg: number;
      note?: string;
    }) =>
      this.request<any>('/inventory/transfer', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // 6. Parties (Clients & Vendors)
  parties = {
    getAll: (type?: 'client' | 'vendor', search?: string) => {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (search) params.set('search', search);
      return this.request<any[]>(`/parties?${params.toString()}`);
    },
    getOne: (id: string) => this.request<any>(`/parties/${id}`),
    create: (data: any) =>
      this.request<any>('/parties', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/parties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getLedger: (id: string) => this.request<any>(`/parties/${id}/ledger`),
    recordPayment: (
      id: string,
      data: {
        direction: 'in' | 'out';
        accountId: string;
        amountPaisa: number;
        method?: string;
        referenceNo?: string;
        note?: string;
      }
    ) =>
      this.request<any>(`/parties/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    sendSms: (id: string, customMessage?: string) =>
      this.request<any>(`/parties/${id}/send-sms`, {
        method: 'POST',
        body: JSON.stringify({ customMessage }),
      }),
  };

  // 7. Accounts & Cashbook
  accounts = {
    getAll: () => this.request<any[]>('/accounts'),
    create: (data: any) =>
      this.request<any>('/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getExpenses: () => this.request<any[]>('/accounts/expenses'),
    createExpense: (data: any) =>
      this.request<any>('/accounts/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDayCloseSummary: () => this.request<any>('/accounts/day-close/summary'),
    submitDayClose: (data: {
      countedCashPaisa: number;
      closedBy?: string;
      note?: string;
    }) =>
      this.request<any>('/accounts/day-close', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Warehouses
  warehouses = {
    getAll: () => this.request<any[]>('/warehouses'),
  };

  // 8. Reports & Analytics
  reports = {
    getSummary: () => this.request<any>('/reports/summary'),
    getDues: () => this.request<any[]>('/reports/dues'),
    getDaily: (date?: string) =>
      this.request<any>(date ? `/reports/daily?date=${date}` : '/reports/daily'),
    getInventoryValuation: () =>
      this.request<any>('/reports/inventory-valuation'),
  };

  // Audit Logs
  audit = {
    getAll: () => this.request<any[]>('/audit-logs'),
    create: (data: any) =>
      this.request<any>('/audit-logs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // 9. Returns
  returns = {
    createSaleReturn: (data: any) =>
      this.request<any>('/returns/sale', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createPurchaseReturn: (data: any) =>
      this.request<any>('/returns/purchase', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // 10. Tenant Settings & Profile
  tenant = {
    getProfile: () => this.request<any>('/tenant/profile'),
    updateProfile: (data: any) =>
      this.request<any>('/tenant/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getUsers: () => this.request<any[]>('/tenant/users'),
    createUser: (data: { name: string; phone: string; role: string; password?: string }) =>
      this.request<any>('/tenant/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateUser: (id: string, data: { active?: boolean; role?: string }) =>
      this.request<any>(`/tenant/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getBackup: () => this.request<any>('/tenant/backup'),
  };
}

export const api = new ApiClient(API_BASE_URL);
export default api;
