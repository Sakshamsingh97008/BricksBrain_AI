import React, { useState } from "react";
import api from "../api/axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function EMICalculator({ defaultAmount = 5000000 }) {
  const [loanAmount, setLoanAmount] = useState(defaultAmount);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/properties/emi", { loanAmount, interestRate, tenureYears });
      setResult(data);
    } catch (err) {
      setError("Could not calculate EMI. Please check the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { calculate(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="card p-6 space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">Loan Amount</label>
            <span className="font-semibold text-brand-600">₹{Number(loanAmount).toLocaleString("en-IN")}</span>
          </div>
          <input type="range" min="500000" max="50000000" step="100000" value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)} className="w-full accent-brand-600" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">Interest Rate</label>
            <span className="font-semibold text-brand-600">{interestRate}%</span>
          </div>
          <input type="range" min="6" max="15" step="0.1" value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)} className="w-full accent-brand-600" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">Tenure</label>
            <span className="font-semibold text-brand-600">{tenureYears} years</span>
          </div>
          <input type="range" min="1" max="30" step="1" value={tenureYears}
            onChange={(e) => setTenureYears(e.target.value)} className="w-full accent-brand-600" />
        </div>
        <button onClick={calculate} disabled={loading} className="btn-primary w-full">
          {loading ? "Calculating..." : "Recalculate EMI"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="card p-6">
        {result ? (
          <>
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">Monthly EMI</p>
              <p className="text-3xl font-extrabold text-brand-600">₹{result.emi.toLocaleString("en-IN")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Total Interest</p>
                <p className="font-bold text-ink">₹{result.totalInterest.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Total Payment</p>
                <p className="font-bold text-ink">₹{result.totalPayment.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={result.schedule}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: "Month", position: "insideBottom", offset: -3, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Line type="monotone" dataKey="balance" stroke="#e63946" strokeWidth={2} dot={false} name="Balance" />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p className="text-gray-400 text-center py-12">Adjust values to see EMI breakdown</p>
        )}
      </div>
    </div>
  );
}
