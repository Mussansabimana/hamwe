import React, { useState } from "react";
import { API_BASE } from "../api";
import { UserPlus, Shield, KeyRound, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterUser({ adminSecret, onSuccess, onClose }) {
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [role, setRole] = useState(1); // 0 = admin, 1 = user
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotif(null);
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, secret, adminSecret, role }),
      });
      const data = await res.json();
      if (data.status) {
        setNotif({ type: "success", message: data.message });
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose && onClose();
        }, 1200);
      } else {
        setNotif({ type: "error", message: data.message });
      }
    } catch {
      setNotif({ type: "error", message: "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-md relative">
          <button onClick={onClose} className="absolute top-2 right-3 text-white/60 hover:text-white text-xl">×</button>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><UserPlus className="w-6 h-6" /> Register New User</h2>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-300" />
              <input type="text" className="flex-1 px-3 py-2 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-white/30" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-300" />
              <input type="text" className="flex-1 px-3 py-2 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/30" placeholder="Secret" value={secret} onChange={e => setSecret(e.target.value)} required disabled={loading} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/80">Role:</span>
              <select className="px-3 py-2 rounded-xl bg-white/20 text-white focus:outline-none border border-white/30" value={role} onChange={e => setRole(Number(e.target.value))} disabled={loading}>
                <option value={1}>User</option>
                <option value={0}>Admin</option>
              </select>
            </div>
            <button type="submit" className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <UserPlus className="w-5 h-5" />} Register
            </button>
            {notif && <div className={`text-sm mt-2 ${notif.type === "error" ? "text-red-400" : "text-green-400"}`}>{notif.message}</div>}
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
