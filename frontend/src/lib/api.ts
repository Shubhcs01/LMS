import { Loan, Payment, Lead, BREResult, LoanConfig } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lms_token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg) as any;
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  // --- Auth APIs ---
  async login(credentials: { email: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { name: string; email: string; password: string; phone?: string }) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: any }>('/auth/me');
  }

  async getDemoAccounts() {
    return this.request<{
      success: boolean;
      accounts: Array<{ role: string; email: string; password: string; name: string }>;
    }>('/demo-accounts');
  }

  // --- Borrower APIs ---
  async checkEligibilityAndSave(details: {
    fullName: string;
    pan: string;
    dateOfBirth: string;
    monthlySalary: number;
    employmentMode: string;
  }) {
    return this.request<{ success: boolean; breResult: BREResult; user: any }>(
      '/borrower/eligibility',
      {
        method: 'POST',
        body: JSON.stringify(details),
      }
    );
  }

  async uploadSalarySlip(file: File) {
    const formData = new FormData();
    formData.append('salarySlip', file);
    return this.request<{ success: boolean; file: any; applicationStepCompleted: number }>(
      '/borrower/upload-slip',
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async calculateLoan(amount: number, tenureDays: number) {
    return this.request<{ success: boolean; calculation: LoanConfig }>(
      `/borrower/calculate?amount=${amount}&tenureDays=${tenureDays}`
    );
  }

  async applyLoan(loanData: { amount: number; tenureDays: number; salarySlip?: any }) {
    return this.request<{ success: boolean; message: string; loan: Loan }>('/borrower/apply', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  }

  async getMyLoans() {
    return this.request<{ success: boolean; count: number; loans: Loan[] }>('/borrower/my-loans');
  }

  async getMyLoanById(id: string) {
    return this.request<{ success: boolean; loan: Loan }>(`/borrower/my-loans/${id}`);
  }

  // --- Operations Dashboard APIs ---
  async getDashboardStats() {
    return this.request<{
      success: boolean;
      counts: {
        applied: number;
        sanctioned: number;
        disbursed: number;
        closed: number;
        rejected: number;
        totalLoans: number;
      };
      financials: {
        totalPrincipalDisbursed: number;
        totalCollected: number;
        totalOutstanding: number;
      };
    }>('/loans/stats');
  }

  async getAllLoans(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return this.request<{ success: boolean; total: number; loans: Loan[] }>(
      `/loans?${query.toString()}`
    );
  }

  async getSanctionQueue() {
    return this.request<{ success: boolean; count: number; loans: Loan[] }>('/loans/queue/sanction');
  }

  async reviewSanction(
    id: string,
    data: { decision: 'APPROVE' | 'REJECT'; remarks?: string; rejectionReason?: string; approvedAmount?: number }
  ) {
    return this.request<{ success: boolean; message: string; loan: Loan }>(
      `/loans/${id}/sanction`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getDisbursementQueue() {
    return this.request<{ success: boolean; count: number; loans: Loan[] }>(
      '/loans/queue/disbursement'
    );
  }

  async recordDisbursement(
    id: string,
    data: {
      disbursementReference: string;
      bankAccountNumber?: string;
      bankIfsc?: string;
      remarks?: string;
    }
  ) {
    return this.request<{ success: boolean; message: string; loan: Loan }>(
      `/loans/${id}/disburse`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getCollectionQueue() {
    return this.request<{ success: boolean; count: number; loans: Loan[] }>(
      '/loans/queue/collection'
    );
  }

  async getLoanDetails(id: string) {
    return this.request<{ success: boolean; loan: Loan }>(`/loans/${id}`);
  }

  // --- Collection Payment APIs ---
  async recordPayment(data: {
    loanId: string;
    utrNumber: string;
    amount: number;
    paymentDate?: string;
    paymentMode?: string;
    remarks?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      payment: Payment;
      loan: { id: string; loanId: string; status: string; repaymentDetails: any; autoClosed: boolean };
    }>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentsByLoan(loanId: string) {
    return this.request<{ success: boolean; count: number; payments: Payment[] }>(
      `/payments/loan/${loanId}`
    );
  }

  // --- Sales Leads APIs ---
  async getLeads(params?: { status?: string; step?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.step) query.append('step', String(params.step));
    if (params?.search) query.append('search', params.search);
    return this.request<{ success: boolean; count: number; leads: Lead[] }>(
      `/leads?${query.toString()}`
    );
  }

  async updateLeadStatus(id: string, data: { leadStatus: string; note?: string }) {
    return this.request<{ success: boolean; message: string; lead: Lead }>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addLeadNote(id: string, note: string) {
    return this.request<{ success: boolean; message: string; lead: Lead }>(`/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }
}

export const api = new ApiClient();
