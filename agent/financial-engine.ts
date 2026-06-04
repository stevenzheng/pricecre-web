// agent/financial-engine.ts
// ============================================================
// 投行级大资管精算计算引擎
// faceRent 入参单位：元/㎡/天 → 内部 ×365 年化
// ============================================================

export interface FinancialInputs {
  faceRentPerSqmPerDay: number;
  freeRentMonths: number;
  leaseTotalMonths: number;
  ltv: number;
  loanRate: number;
  opexRatio: number;
  assetPricePerSqm: number;
  benchmarkCapRate: number;
  noiCagr3Y: number;
}

export interface FinancialOutputs {
  netEffectiveRent: number;
  grossRevenueYear: number;
  noi: number;
  capRate: number;
  equityCapital: number;
  annualDebtService: number;
  cashOnCashReturn: number;
  projectedIrr5Y: number;
  irrMethod: "DCF_NEWTON_RAPHSON" | "FALLBACK_ESTIMATE";
  exitAssetValue: number;
}

export function calcNetEffectiveRent(
  faceRentPerSqmPerDay: number,
  freeRentMonths: number,
  leaseTotalMonths: number
): number {
  if (leaseTotalMonths <= 0) throw new Error("leaseTotalMonths must be > 0");
  if (freeRentMonths >= leaseTotalMonths)
    throw new Error("freeRentMonths cannot exceed leaseTotalMonths");

  const annualRent = faceRentPerSqmPerDay * 365;
  const effectiveFactor = (leaseTotalMonths - freeRentMonths) / leaseTotalMonths;
  return parseFloat((annualRent * effectiveFactor).toFixed(2));
}

export function solveIRR(cashFlows: number[], maxIterations = 1000, tolerance = 1e-8): number | null {
  if (cashFlows.length < 2) return null;
  if (cashFlows[0] >= 0) return null;

  const initialGuesses = [0.1, 0.05, 0.15, 0.20, -0.05];
  for (const guess of initialGuesses) {
    let rate = guess;
    for (let iter = 0; iter < maxIterations; iter++) {
      let npv = 0, dnpv = 0;
      cashFlows.forEach((cf, t) => {
        const df = Math.pow(1 + rate, t);
        npv += cf / df;
        dnpv -= (t * cf) / (df * (1 + rate));
      });
      if (Math.abs(dnpv) < 1e-12) break;
      const newRate = rate - npv / dnpv;
      if (Math.abs(newRate - rate) < tolerance) {
        if (newRate > -0.5 && newRate < 1.0) return parseFloat(newRate.toFixed(4));
        break;
      }
      rate = newRate;
    }
  }
  return null;
}

export function calcAnnualDebtService(
  principal: number,
  annualRate: number,
  loanYears: number = 20
): number {
  const monthlyRate = annualRate / 12;
  const n = loanYears * 12;
  if (monthlyRate === 0) return (principal / n) * 12;
  const pmt =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
    (Math.pow(1 + monthlyRate, n) - 1);
  return parseFloat((pmt * 12).toFixed(2));
}

export function calcRemainingLoanBalance(
  principal: number,
  annualRate: number,
  loanYears = 20,
  holdYears = 5
): number {
  const monthlyRate = annualRate / 12;
  const totalMonths = loanYears * 12;
  const paidMonths = holdYears * 12;
  if (monthlyRate === 0) return principal * (1 - paidMonths / totalMonths);
  const remaining =
    principal *
    (Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, paidMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);
  return parseFloat(remaining.toFixed(2));
}

export function runFullFinancialCalc(inputs: FinancialInputs): FinancialOutputs {
  const {
    faceRentPerSqmPerDay,
    freeRentMonths,
    leaseTotalMonths,
    ltv,
    loanRate,
    opexRatio,
    assetPricePerSqm,
    benchmarkCapRate,
    noiCagr3Y,
  } = inputs;

  const netEffectiveRent = calcNetEffectiveRent(faceRentPerSqmPerDay, freeRentMonths, leaseTotalMonths);
  const grossRevenueYear = netEffectiveRent;
  const noi = parseFloat((grossRevenueYear * (1 - opexRatio)).toFixed(2));
  const capRate = parseFloat((noi / assetPricePerSqm).toFixed(4));

  const totalLoan = assetPricePerSqm * ltv;
  const equityCapital = assetPricePerSqm * (1 - ltv);
  const annualDebtService = calcAnnualDebtService(totalLoan, loanRate, 20);

  const annualCashFlow = noi - annualDebtService;
  const cashOnCashReturn = equityCapital > 0 ? parseFloat((annualCashFlow / equityCapital).toFixed(4)) : 0;

  const year5Noi = noi * Math.pow(1 + noiCagr3Y, 5);
  const exitAssetValue = (year5Noi / benchmarkCapRate) * (1 - 0.02);
  const remainingLoanAtExit = calcRemainingLoanBalance(totalLoan, loanRate, 20, 5);

  const cashFlows: number[] = [
    -equityCapital,
    ...Array.from({ length: 4 }, (_, i) => noi * Math.pow(1 + noiCagr3Y, i + 1) - annualDebtService),
    year5Noi - annualDebtService + exitAssetValue - remainingLoanAtExit,
  ];

  const irrResult = solveIRR(cashFlows);
  const projectedIrr5Y = irrResult ?? parseFloat((capRate * 1.2).toFixed(4));
  const irrMethod: "DCF_NEWTON_RAPHSON" | "FALLBACK_ESTIMATE" =
    irrResult !== null ? "DCF_NEWTON_RAPHSON" : "FALLBACK_ESTIMATE";

  return {
    netEffectiveRent,
    grossRevenueYear,
    noi,
    capRate,
    equityCapital,
    annualDebtService,
    cashOnCashReturn,
    projectedIrr5Y,
    irrMethod,
    exitAssetValue,
  };
}
