import React, { useEffect, useState } from "react";
import { API_BASE } from "../api";

import { useNavigate } from "react-router-dom";


export default function Login(props) {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (data.status) {
        props.data.setUser({ ...data.user, secret })
        navigate("/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
        console.log(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-gradient-to-br from-white/60 to-green-100 shadow-neu rounded-3xl p-10 w-full max-w-md border border-white/40">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-blue-500 to-purple-600 mb-6 drop-shadow-lg">Hamwe Chat</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input
            type="password"
            className="px-5 py-3 rounded-2xl bg-white/60 shadow-inner border border-white/40 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter your secret..."
            value={secret}
            onChange={e => setSecret(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 text-white font-bold py-2 rounded-2xl shadow-neu hover:scale-105 transition-transform disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </form>
        <div className="mt-6 text-center">
          <span className="text-gray-500">No account?</span>
          <button onClick={() => navigate("/register")}
            className="ml-2 text-green-600 font-semibold hover:underline">Register</button>
        </div>
      </div>
    </div>
  );
}
