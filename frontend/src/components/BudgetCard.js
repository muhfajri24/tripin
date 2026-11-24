import React from 'react';
import { DollarSign, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../data/mockData';

const budgetCategories = [
  { key: 'transportation', label: 'Transportation', emoji: '🚗', color: '#176B67' },
  { key: 'food', label: 'Food & Drinks', emoji: '🍜', color: '#FF6B5E' },
  { key: 'tickets', label: 'Entry Tickets', emoji: '🎟️', color: '#FFC857' },
  { key: 'accommodation', label: 'Accommodation', emoji: '🏨', color: '#6B7FD7' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#E879AC' },
  { key: 'misc', label: 'Miscellaneous', emoji: '📌', color: '#94A3B8' },
];

function BudgetCard({ budget, compact = false }) {
  const { total, breakdown } = budget;
  const totalSpent = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const remaining = total - totalSpent;
  const pct = Math.min((totalSpent / total) * 100, 100);

  if (compact) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-charcoal text-sm">Budget Overview</h3>
          <span className="text-xs text-teal font-semibold">{Math.round(pct)}% used</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-coral to-yellow-trip transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-charcoal-lighter">Spent: <span className="text-charcoal font-semibold">{formatCurrency(totalSpent)}</span></span>
          <span className="text-charcoal-lighter">Budget: <span className="text-teal font-semibold">{formatCurrency(total)}</span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-charcoal text-base">Budget Overview</h3>
        <div className="flex items-center gap-1 text-teal bg-teal/10 px-3 py-1 rounded-full text-sm font-semibold">
          <DollarSign size={14} />
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Total progress */}
      <div className="bg-gradient-to-r from-teal/5 to-coral/5 rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-charcoal-lighter">Total estimated</span>
          <span className="font-bold text-charcoal">{formatCurrency(totalSpent)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-teal to-teal-light transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-charcoal-lighter">{Math.round(pct)}% of budget</span>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingDown size={11} />
            <span>Rp{(remaining / 1000).toFixed(0)}k remaining</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {budgetCategories.map(({ key, label, emoji, color }) => {
          const amount = breakdown[key] || 0;
          const catPct = Math.round((amount / totalSpent) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-lg w-6 flex-shrink-0">{emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-charcoal-lighter">{label}</span>
                  <span className="font-semibold text-charcoal">{formatCurrency(amount)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${catPct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
              <span className="text-xs text-charcoal-lighter w-7 text-right">{catPct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BudgetCard;

