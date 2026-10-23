import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartHandshake, PhoneCall, MessageCircle, X, ShieldAlert, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EmergencyModal: React.FC = () => {
  const { showEmergencyModal, setShowEmergencyModal } = useAuth();

  if (!showEmergencyModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 overflow-hidden relative"
        >
          <button
            onClick={() => setShowEmergencyModal(false)}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4 text-emerald-800">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <HeartHandshake className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">You Are Not Alone</h3>
              <p className="text-xs text-stone-500 font-medium">GrowWise Real-World Care & Safety</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-amber-900">
              GrowWise is an AI growth tool and <strong>cannot replace professional mental health care or medical advice</strong>. If you are feeling overwhelmed, distressed, or having thoughts of self-harm, please connect with real human support immediately.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">Suicide & Crisis Lifeline</h4>
                  <p className="text-xs text-stone-500">Free, confidential 24/7 support (US & Canada)</p>
                </div>
                <a
                  href="tel:988"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call 988
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">Crisis Text Line</h4>
                  <p className="text-xs text-stone-500">Text HOME to connect with a crisis counselor 24/7</p>
                </div>
                <a
                  href="sms:741741&body=HOME"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Text 741741
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">International Emergency Services</h4>
                  <p className="text-xs text-stone-500">European Union / India / Global emergency response</p>
                </div>
                <a
                  href="tel:112"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Dial 112
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl mb-6">
            <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">On-Campus Support</h5>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Most colleges and universities provide free, confidential student counseling and wellness centers. Consider reaching out to your student affairs office, residence advisor, or a professor you trust.
            </p>
          </div>

          <button
            onClick={() => setShowEmergencyModal(false)}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold rounded-xl transition-colors"
          >
            Return to GrowWise
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
