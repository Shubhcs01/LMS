import { BRE_CONFIG, EmploymentMode } from '../constants/index.js';

export interface BREInput {
  fullName: string;
  pan: string;
  dateOfBirth: string | Date;
  monthlySalary: number;
  employmentMode: string;
}

export interface RuleCheckResult {
  ruleName: string;
  passed: boolean;
  message: string;
  value?: any;
}

export interface BREResult {
  passed: boolean;
  age: number;
  checks: {
    ageCheck: RuleCheckResult;
    salaryCheck: RuleCheckResult;
    panCheck: RuleCheckResult;
    employmentCheck: RuleCheckResult;
  };
  rejectionReasons: string[];
}

export function calculateAge(dob: string | Date): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export class BREService {
  /**
   * Evaluates an applicant's profile against lending underwriting rules.
   *
   * Business Rules:
   * 1. Age: Applicant must be between 23 and 50 years old (inclusive).
   * 2. Salary: Monthly salary must be at least ₹25,000.
   * 3. PAN: Must match standard Indian PAN card format (5 uppercase letters, 4 digits, 1 uppercase letter).
   * 4. Employment: Must be Salaried or Self-Employed (Unemployed is strictly rejected).
   */
  public static evaluate(input: BREInput): BREResult {
    const age = calculateAge(input.dateOfBirth);
    const rejectionReasons: string[] = [];

    // 1. Age Check
    const agePassed = age >= BRE_CONFIG.MIN_AGE && age <= BRE_CONFIG.MAX_AGE;
    const ageCheck: RuleCheckResult = {
      ruleName: 'Age Eligibility',
      passed: agePassed,
      value: age,
      message: agePassed
        ? `Applicant age (${age} years) is within the eligible bracket of ${BRE_CONFIG.MIN_AGE}-${BRE_CONFIG.MAX_AGE} years.`
        : `Applicant age must be between ${BRE_CONFIG.MIN_AGE} and ${BRE_CONFIG.MAX_AGE} years. Current calculated age: ${age} years.`,
    };
    if (!agePassed) {
      rejectionReasons.push(ageCheck.message);
    }

    // 2. Salary Check
    const salaryPassed = typeof input.monthlySalary === 'number' && input.monthlySalary >= BRE_CONFIG.MIN_SALARY;
    const salaryCheck: RuleCheckResult = {
      ruleName: 'Minimum Income Check',
      passed: salaryPassed,
      value: input.monthlySalary,
      message: salaryPassed
        ? `Monthly salary (₹${input.monthlySalary.toLocaleString('en-IN')}) meets the minimum threshold of ₹${BRE_CONFIG.MIN_SALARY.toLocaleString('en-IN')}.`
        : `Monthly income must be at least ₹${BRE_CONFIG.MIN_SALARY.toLocaleString('en-IN')}. Current declared salary: ₹${(input.monthlySalary || 0).toLocaleString('en-IN')}.`,
    };
    if (!salaryPassed) {
      rejectionReasons.push(salaryCheck.message);
    }

    // 3. PAN Format Check
    const normalizedPan = (input.pan || '').trim().toUpperCase();
    const panPassed = BRE_CONFIG.PAN_REGEX.test(normalizedPan);
    const panCheck: RuleCheckResult = {
      ruleName: 'PAN Verification',
      passed: panPassed,
      value: normalizedPan,
      message: panPassed
        ? `PAN format (${normalizedPan}) is valid.`
        : `Invalid PAN format "${input.pan}". Valid PAN must consist of 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F).`,
    };
    if (!panPassed) {
      rejectionReasons.push(panCheck.message);
    }

    // 4. Employment Mode Check
    const employmentPassed =
      Boolean(input.employmentMode) &&
      input.employmentMode !== EmploymentMode.UNEMPLOYED &&
      (input.employmentMode === EmploymentMode.SALARIED || input.employmentMode === EmploymentMode.SELF_EMPLOYED);
    const employmentCheck: RuleCheckResult = {
      ruleName: 'Employment Status Check',
      passed: employmentPassed,
      value: input.employmentMode,
      message: employmentPassed
        ? `Employment mode "${input.employmentMode}" is eligible.`
        : `Unemployed applicants are not eligible for loan approval. Must be Salaried or Self-Employed.`,
    };
    if (!employmentPassed) {
      rejectionReasons.push(employmentCheck.message);
    }

    const allPassed = agePassed && salaryPassed && panPassed && employmentPassed;

    return {
      passed: allPassed,
      age,
      checks: {
        ageCheck,
        salaryCheck,
        panCheck,
        employmentCheck,
      },
      rejectionReasons,
    };
  }
}
