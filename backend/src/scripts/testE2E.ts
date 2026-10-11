async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await globalThis.fetch(url, init);
  return (await res.json()) as T;
}

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('========================================================');
  console.log('🚀 RUNNING END-TO-END AUTOMATED VERIFICATION SUITE');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, extra?: any) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, extra || '');
    }
  }

  // 1. Health & Demo Accounts
  const healthRes = await fetchJson(`${BASE_URL}/health`);
  assert(healthRes.status === 'OK', 'Backend Health Check returns OK');

  const demoRes = await fetchJson(`${BASE_URL}/demo-accounts`);
  assert(demoRes.accounts?.length === 6, 'Demo accounts endpoint returns all 6 seeded roles');

  // 2. Auth: Login as Borrower
  const borrowerLogin = await fetchJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'borrower@lms.com', password: 'Password@123' }),
  });
  assert(borrowerLogin.success && borrowerLogin.token, 'Login as Borrower successful');
  const borrowerToken: string = borrowerLogin.token;

  // 3. RBAC Test: Borrower trying to access Sanction Queue -> must return 403 Forbidden!
  const forbiddenCheck = await globalThis.fetch(`${BASE_URL}/loans/queue/sanction`, {
    headers: { Authorization: `Bearer ${borrowerToken}` },
  });
  assert(forbiddenCheck.status === 403, 'RBAC Enforced: Borrower blocked from Sanction API with 403 Forbidden');

  // 4. BRE Failure Tests:
  // 4a. Age too young (DOB 2010 -> age 16)
  const breAgeFail = await globalThis.fetch(`${BASE_URL}/borrower/eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
    body: JSON.stringify({
      fullName: 'Rahul Sharma',
      pan: 'ABCDE1234F',
      dateOfBirth: '2010-01-01',
      monthlySalary: 50000,
      employmentMode: 'Salaried',
    }),
  });
  assert(breAgeFail.status === 422, 'BRE Rejection: Age < 23 triggers 422 Unprocessable Entity');
  const breAgeData: any = await breAgeFail.json();
  assert(breAgeData.breResult?.checks?.ageCheck?.passed === false, 'BRE Rejection: ageCheck.passed is false');

  // 4b. Salary below ₹25,000 (declared ₹18,000)
  const breSalaryFail = await globalThis.fetch(`${BASE_URL}/borrower/eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
    body: JSON.stringify({
      fullName: 'Rahul Sharma',
      pan: 'ABCDE1234F',
      dateOfBirth: '1995-01-01',
      monthlySalary: 18000,
      employmentMode: 'Salaried',
    }),
  });
  assert(breSalaryFail.status === 422, 'BRE Rejection: Salary < ₹25,000 triggers 422');

  // 4c. Invalid PAN format ('INVALIDPAN1')
  const brePanFail = await globalThis.fetch(`${BASE_URL}/borrower/eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
    body: JSON.stringify({
      fullName: 'Rahul Sharma',
      pan: 'INVALIDPAN1',
      dateOfBirth: '1995-01-01',
      monthlySalary: 50000,
      employmentMode: 'Salaried',
    }),
  });
  assert(brePanFail.status === 422, 'BRE Rejection: Invalid PAN regex triggers 422');

  // 4d. Unemployed status
  const breEmpFail = await globalThis.fetch(`${BASE_URL}/borrower/eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
    body: JSON.stringify({
      fullName: 'Rahul Sharma',
      pan: 'ABCDE1234F',
      dateOfBirth: '1995-01-01',
      monthlySalary: 50000,
      employmentMode: 'Unemployed',
    }),
  });
  assert(breEmpFail.status === 422, 'BRE Rejection: Unemployed mode triggers 422');

  // 5. Complete Lifecycle Test with a Brand New Borrower
  const newEmail = `tester-${Date.now()}@example.com`;
  const registerRes = await fetchJson(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dev Test Applicant',
      email: newEmail,
      password: 'Password@123',
      phone: '+91 99999 88888',
    }),
  });
  assert(registerRes.success && registerRes.token, 'Step 1: New borrower registered successfully');
  const newBorrowerToken: string = registerRes.token;

  // Verify that registering created a lead in Sales pipeline
  const salesLogin = await fetchJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@lms.com', password: 'Password@123' }),
  });
  const salesToken: string = salesLogin.token;

  const leadsRes = await fetchJson(`${BASE_URL}/leads?search=${encodeURIComponent(newEmail)}`, {
    headers: { Authorization: `Bearer ${salesToken}` },
  });
  assert(leadsRes.leads?.length >= 1, 'Sales Module: Registered borrower tracked as lead in Sales pipeline');

  // Step 2: Valid Personal Details + BRE Pass
  const brePassRes = await fetchJson(`${BASE_URL}/borrower/eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newBorrowerToken}` },
    body: JSON.stringify({
      fullName: 'Dev Test Applicant',
      pan: 'ABCDE1234F',
      dateOfBirth: '1996-06-15', // Age ~30
      monthlySalary: 75000,
      employmentMode: 'Salaried',
    }),
  });
  assert(brePassRes.success && brePassRes.breResult?.passed === true, 'Step 2: BRE evaluation PASSED with valid details');

  // Step 3: Math verification for Loan Config
  const mathCalc = await fetchJson(`${BASE_URL}/borrower/calculate?amount=120000&tenureDays=120`, {
    headers: { Authorization: `Bearer ${newBorrowerToken}` },
  });
  // P = 120,000, R = 12, T = 120 -> SI = (120000 * 12 * 120) / (365 * 100) = 4734.25, Total = 124,734.25
  const expectedSI = Math.round(((120000 * 12 * 120) / 36500) * 100) / 100;
  assert(
    mathCalc.calculation?.interestAmount === expectedSI,
    `Step 4: Simple Interest calculated correctly (SI = ₹${mathCalc.calculation?.interestAmount})`
  );

  // Apply for Loan -> APPLIED
  const applyRes = await fetchJson(`${BASE_URL}/borrower/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newBorrowerToken}` },
    body: JSON.stringify({
      amount: 120000,
      tenureDays: 120,
      salarySlip: {
        filename: 'sample_salary_slip.pdf',
        originalName: 'Salary_Slip_Test.pdf',
        path: 'uploads/sample_salary_slip.pdf',
        mimetype: 'application/pdf',
        size: 150000,
      },
    }),
  });
  assert(applyRes.success && applyRes.loan?.status === 'APPLIED', `Step 4: Loan created in APPLIED status (ID: ${applyRes.loan?.loanId})`);
  const createdLoanId = applyRes.loan._id;

  // Sanction Stage: Login as Sanction Executive and Approve
  const sanctionLogin = await fetchJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sanction@lms.com', password: 'Password@123' }),
  });
  const sanctionToken: string = sanctionLogin.token;

  const approveRes = await fetchJson(`${BASE_URL}/loans/${createdLoanId}/sanction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sanctionToken}` },
    body: JSON.stringify({
      decision: 'APPROVE',
      remarks: 'Verified bank statements and KYC. Sanction approved.',
    }),
  });
  assert(approveRes.success && approveRes.loan?.status === 'SANCTIONED', 'Sanction Module: Transition APPLIED -> SANCTIONED');

  // Disbursement Stage: Login as Disbursement Executive and Disburse
  const disburseLogin = await fetchJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'disbursement@lms.com', password: 'Password@123' }),
  });
  const disburseToken: string = disburseLogin.token;

  const disburseRes = await fetchJson(`${BASE_URL}/loans/${createdLoanId}/disburse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${disburseToken}` },
    body: JSON.stringify({
      disbursementReference: `DISB-TXN-${Date.now()}`,
      bankAccountNumber: '9876543210',
      bankIfsc: 'HDFC0001234',
      remarks: 'Funds released via RTGS',
    }),
  });
  assert(disburseRes.success && disburseRes.loan?.status === 'DISBURSED', 'Disbursement Module: Transition SANCTIONED -> DISBURSED');

  // Collection Stage: Login as Collection Executive and record payments
  const collectionLogin = await fetchJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'collection@lms.com', password: 'Password@123' }),
  });
  const collectionToken: string = collectionLogin.token;

  const totalDue: number = disburseRes.loan.repaymentDetails.totalRepayment;
  const uniqueUtr = `UTR${Date.now()}`;

  // 1. Test duplicate UTR check
  const payRes1 = await fetchJson(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${collectionToken}` },
    body: JSON.stringify({
      loanId: createdLoanId,
      utrNumber: uniqueUtr,
      amount: totalDue,
      paymentMode: 'IMPS',
      remarks: 'Full settlement payment',
    }),
  });
  assert(payRes1.success && payRes1.loan?.autoClosed === true, 'Collection Module: Full payment received -> Auto-closed loan to CLOSED');

  // 2. Test duplicate UTR rejection
  const duplicateUtrRes = await globalThis.fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${collectionToken}` },
    body: JSON.stringify({
      loanId: createdLoanId,
      utrNumber: uniqueUtr, // reusing same UTR
      amount: 100,
    }),
  });
  assert(duplicateUtrRes.status === 409, 'Collection Module: Duplicate UTR blocked with 409 Conflict');

  console.log('\n========================================================');
  console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`);
  console.log('========================================================\n');
}

runTests().catch(console.error);
