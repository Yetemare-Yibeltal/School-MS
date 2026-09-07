// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ETHIOPIAN TAX CALCULATOR UTILITY
// kat-school/server/src/utils/taxCalculator.util.js
// ============================================

'use strict';

// ─── Ethiopian Income Tax Brackets ────────────
// As per Ethiopian Income Tax Proclamation No. 979/2016
// Monthly salary brackets in ETB
const INCOME_TAX_BRACKETS = [
  { min: 0, max: 600, rate: 0, deduction: 0 },
  { min: 601, max: 1650, rate: 0.1, deduction: 60 },
  { min: 1651, max: 3200, rate: 0.15, deduction: 142.5 },
  { min: 3201, max: 5250, rate: 0.2, deduction: 302.5 },
  { min: 5251, max: 7800, rate: 0.25, deduction: 565 },
  { min: 7801, max: 10900, rate: 0.3, deduction: 955 },
  { min: 10901, max: Infinity, rate: 0.35, deduction: 1500 },
];

// ─── Pension Rates ────────────────────────────
const PENSION_RATES = {
  EMPLOYEE: 0.07, // Employee contributes 7%
  EMPLOYER: 0.11, // Employer contributes 11%
  TOTAL: 0.18, // Total pension contribution 18%
};

// ─── Calculate Income Tax ─────────────────────
// Returns income tax amount based on taxable income
const calculateIncomeTax = (taxableIncome) => {
  if (taxableIncome <= 0) return 0;

  // Find applicable bracket
  const bracket = INCOME_TAX_BRACKETS.find((b) => taxableIncome >= b.min && taxableIncome <= b.max);

  if (!bracket) return 0;

  const tax = taxableIncome * bracket.rate - bracket.deduction;

  return Math.max(0, Math.round(tax * 100) / 100);
};

// ─── Calculate Employee Pension ───────────────
const calculateEmployeePension = (basicSalary) => {
  if (basicSalary <= 0) return 0;
  return Math.round(basicSalary * PENSION_RATES.EMPLOYEE * 100) / 100;
};

// ─── Calculate Employer Pension ───────────────
const calculateEmployerPension = (basicSalary) => {
  if (basicSalary <= 0) return 0;
  return Math.round(basicSalary * PENSION_RATES.EMPLOYER * 100) / 100;
};

// ─── Calculate Absence Deduction ─────────────
const calculateAbsenceDeduction = (basicSalary, absentDays, workingDaysPerMonth = 26) => {
  if (absentDays <= 0 || basicSalary <= 0) return 0;
  const dailyRate = basicSalary / workingDaysPerMonth;
  return Math.round(dailyRate * absentDays * 100) / 100;
};

// ─── Calculate Late Deduction ─────────────────
// 3 late days = 1 absence day deduction
const calculateLateDeduction = (
  basicSalary,
  lateDays,
  workingDaysPerMonth = 26,
  lateDaysPerAbsence = 3
) => {
  if (lateDays <= 0 || basicSalary <= 0) return 0;
  const absenceEquivalent = Math.floor(lateDays / lateDaysPerAbsence);
  return calculateAbsenceDeduction(basicSalary, absenceEquivalent, workingDaysPerMonth);
};

// ─── Full Payroll Calculation ─────────────────
const calculateNetSalary = ({
  basicSalary = 0,
  housingAllowance = 0,
  transportAllowance = 0,
  medicalAllowance = 0,
  teachingAllowance = 0,
  managementAllowance = 0,
  otherAllowances = 0,
  overtimePay = 0,
  bonus = 0,
  absentDays = 0,
  lateDays = 0,
  loanDeduction = 0,
  otherDeductions = 0,
  workingDaysPerMonth = 26,
}) => {
  // ── Gross Earnings ───────────────────────────
  const grossEarnings =
    basicSalary +
    housingAllowance +
    transportAllowance +
    medicalAllowance +
    teachingAllowance +
    managementAllowance +
    otherAllowances +
    overtimePay +
    bonus;

  // ── Taxable Income ───────────────────────────
  // Non-taxable: housing, transport, medical allowances
  const taxableIncome = basicSalary + teachingAllowance + managementAllowance + overtimePay + bonus;

  // ── Statutory Deductions ─────────────────────
  const incomeTax = calculateIncomeTax(taxableIncome);
  const employeePension = calculateEmployeePension(basicSalary);
  const employerPension = calculateEmployerPension(basicSalary);

  // ── Other Deductions ─────────────────────────
  const absenceDeduction = calculateAbsenceDeduction(basicSalary, absentDays, workingDaysPerMonth);
  const lateDeduction = calculateLateDeduction(basicSalary, lateDays, workingDaysPerMonth);

  // ── Total Employee Deductions ─────────────────
  // (Employer pension is NOT deducted from employee)
  const totalDeductions =
    incomeTax +
    employeePension +
    absenceDeduction +
    lateDeduction +
    loanDeduction +
    otherDeductions;

  // ── Net Salary ────────────────────────────────
  const netSalary = Math.max(0, grossEarnings - totalDeductions);

  return {
    // Earnings
    basicSalary: round(basicSalary),
    housingAllowance: round(housingAllowance),
    transportAllowance: round(transportAllowance),
    medicalAllowance: round(medicalAllowance),
    teachingAllowance: round(teachingAllowance),
    managementAllowance: round(managementAllowance),
    otherAllowances: round(otherAllowances),
    overtimePay: round(overtimePay),
    bonus: round(bonus),
    grossEarnings: round(grossEarnings),
    taxableIncome: round(taxableIncome),

    // Deductions
    incomeTax: round(incomeTax),
    employeePension: round(employeePension),
    employerPension: round(employerPension),
    absenceDeduction: round(absenceDeduction),
    lateDeduction: round(lateDeduction),
    loanDeduction: round(loanDeduction),
    otherDeductions: round(otherDeductions),
    totalDeductions: round(totalDeductions),

    // Net
    netSalary: round(netSalary),

    // Total cost to employer
    totalEmployerCost: round(grossEarnings + employerPension),
  };
};

// ─── Calculate Overtime Pay ───────────────────
const calculateOvertimePay = (
  basicSalary,
  overtimeHours,
  multiplier = 1.5,
  workingHoursPerDay = 8,
  workingDaysPerMonth = 26
) => {
  if (overtimeHours <= 0 || basicSalary <= 0) return 0;

  const hourlyRate = basicSalary / (workingDaysPerMonth * workingHoursPerDay);
  return Math.round(hourlyRate * overtimeHours * multiplier * 100) / 100;
};

// ─── Get Tax Bracket ──────────────────────────
const getTaxBracket = (taxableIncome) => {
  return INCOME_TAX_BRACKETS.find((b) => taxableIncome >= b.min && taxableIncome <= b.max);
};

// ─── Format Tax Summary ───────────────────────
const formatTaxSummary = (taxableIncome) => {
  const tax = calculateIncomeTax(taxableIncome);
  const bracket = getTaxBracket(taxableIncome);
  const effectiveRate = taxableIncome > 0 ? Math.round((tax / taxableIncome) * 10000) / 100 : 0;

  return {
    taxableIncome: round(taxableIncome),
    taxAmount: round(tax),
    taxBracket: bracket
      ? `${bracket.min} - ${bracket.max === Infinity ? 'above' : bracket.max}`
      : 'Unknown',
    marginalRate: bracket ? `${bracket.rate * 100}%` : '0%',
    effectiveRate: `${effectiveRate}%`,
  };
};

// ─── Validate Salary ──────────────────────────
const validateSalary = (basicSalary, minSalary = 0, maxSalary = Infinity) => {
  if (basicSalary < 0) {
    return { valid: false, message: 'Salary cannot be negative' };
  }
  if (minSalary > 0 && basicSalary < minSalary) {
    return {
      valid: false,
      message: `Salary is below minimum (ETB ${minSalary.toLocaleString()})`,
    };
  }
  if (maxSalary < Infinity && basicSalary > maxSalary) {
    return {
      valid: false,
      message: `Salary exceeds maximum (ETB ${maxSalary.toLocaleString()})`,
    };
  }
  return { valid: true };
};

// ─── Utility ──────────────────────────────────
const round = (value) => Math.round((value || 0) * 100) / 100;

module.exports = {
  INCOME_TAX_BRACKETS,
  PENSION_RATES,
  calculateIncomeTax,
  calculateEmployeePension,
  calculateEmployerPension,
  calculateAbsenceDeduction,
  calculateLateDeduction,
  calculateNetSalary,
  calculateOvertimePay,
  getTaxBracket,
  formatTaxSummary,
  validateSalary,
};
