import React, {useState} from "react";
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import RegisterUser from "./components/RegisterUser";
import Dashboard from "./components/Dashboard";

function App() {

  const [user, setUser] = useState(null);


  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-300 via-blue-200 to-purple-300 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login data = {{setUser: setUser}}/> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/dashboard" element={  user ? <Dashboard data = { user} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
