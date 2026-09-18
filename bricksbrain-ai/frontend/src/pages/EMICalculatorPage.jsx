import React from "react";
import { useLocation } from "react-router-dom";
import EMICalculator from "../components/EMICalculator";

export default function EMICalculatorPage() {
  const location = useLocation();
  const defaultAmount = location.state?.amount ? Math.round(location.state.amount * 0.8) : 5000000;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">EMI Calculator</h1>
      <p className="text-sm text-gray-500 mb-8">Estimate your monthly home loan installment and view the amortization schedule.</p>
      <EMICalculator defaultAmount={defaultAmount} />
    </div>
  );
}
