import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';
import { useReducedMotion } from './useReducedMotion';

let toastSubscriber = null;

/**
 * Global trigger function to show a toast anywhere in the app.
 * Usage: showTripinToast({ message: 'Itinerary tersimpan!', type: 'success' })
 */
export function showTripinToast({ message, type = 'success', duration = 3500 }) {
  if (toastSubscriber) {
    toastSubscriber({ id: Date.now() + Math.random(), message, type, duration });
  }
}

export const toast = {
  success: (msg, duration) => showTripinToast({ message: msg, type: 'success', duration }),
  info: (msg, duration) => showTripinToast({ message: msg, type: 'info', duration }),
  warning: (msg, duration) => showTripinToast({ message: msg, type: 'warning', duration }),
  ai: (msg, duration) => showTripinToast({ message: msg, type: 'ai', duration }),
};

/**
 * Floating Toast Container. Rendered once in AppLayout or App.
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    toastSubscriber = (newToast) => {
      setToasts((prev) => [...prev.slice(-3), newToast]);

      if (newToast.duration) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    return () => {
      toastSubscriber = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'info':
        return <Info size={18} className="text-teal" />;
      case 'warning':
        return <AlertCircle size={18} className="text-yellow-600" />;
      case 'ai':
        return <Sparkles size={18} className="text-coral animate-spin" style={{ animationDuration: '3s' }} />;
      case 'success':
      default:
        return <CheckCircle2 size={18} className="text-teal" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'ai':
        return 'border-coral/30 shadow-coral/20';
      case 'warning':
        return 'border-yellow/40 shadow-yellow/20';
      case 'info':
        return 'border-teal/30 shadow-teal/20';
      case 'success':
      default:
        return 'border-teal/30 shadow-teal/20';
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none select-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md text-charcoal rounded-xl border shadow-xl ${getBorderColor(t.type)}`}
          >
            <div className="flex-shrink-0">{getIcon(t.type)}</div>
            <p className="text-xs sm:text-sm font-semibold flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-charcoal p-1 transition-colors rounded-lg focus:outline-none"
              aria-label="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
