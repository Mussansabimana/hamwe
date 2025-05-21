import React, { useEffect, useState, useCallback } from "react";
import { User, Trash2, FileText, Send, LogOut, Loader2, Users, UserCheck, UserPlus, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { API_BASE } from "../api";
import RegisterUser from "./RegisterUser";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

let socket;
function getSocket(secret, setUsers, setMessages, setNotif) {
    if (!socket) {
        socket = io(API_BASE, { transports: ["websocket"], autoConnect: false });
    }
    if (!socket.connected) {
        socket.connect();
        socket.emit("connected-first", { secret }, (resp) => {
            if (resp && resp.status) {
                if (Array.isArray(resp.users)) setUsers(resp.users);
                if (Array.isArray(resp.messages)) setMessages(resp.messages);
            } else if (resp && resp.message) {
                setNotif && setNotif({ type: "error", message: resp.message });
            }
        });
    }
    return socket;
}

export default function Dashboard({ data }) {
    // Dedicated socket connection for this user
    const [socketInstance, setSocketInstance] = useState(null);
    const [users, setUsers] = useState([]);
    const [showRegister, setShowRegister] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notif, setNotif] = useState(null);
    const [msgLoading, setMsgLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [user, setUser] = useState(data);
    const navigate = useNavigate()


    function onLogout() {
        navigate("/login");

    }



    // Scroll to bottom on new message
    useEffect(() => {
                
        const chatScroll = document.getElementById("chat-scroll");
        if (chatScroll) {
            chatScroll.scrollTop = chatScroll.scrollHeight;
        }
    }, [messages, msgLoading]);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/users`);
            const data = await res.json();
            if (data.status) setUsers(data.data);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        setMsgLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/messages`);
            const data = await res.json();
            if (data.status) setMessages(data.data);
        } finally {
            setMsgLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch via REST if socket fails
        let socketInit = false;
        const s = getSocket(user.secret, setUsers, setMessages, setNotif);
        setSocketInstance(s);
        s.on("message", (msg) => setMessages((prev) => [...prev, msg]));
        s.on("notification", (n) => setNotif(n));
        s.on("user-status", (status) => {
            setUsers((prev) => prev.map(u => u.id === status.userId ? { ...u, active: status.status === "online" } : u));
        });
        s.on("force-disconnect", (data) => {
            setNotif({ type: "error", message: data.message || "You have been logged out from another location." });
            setTimeout(() => window.location.reload(), 2000);
        });
        // If socket doesn't return initial data, fallback to REST
        setTimeout(() => {
            if (!socketInit && (users.length === 0 || messages.length === 0)) {
                fetchUsers();
                fetchMessages();
            }
        }, 2000);
        return () => {
            s.off("message");
            s.off("notification");
            s.off("user-status");
            s.off("force-disconnect");
            // Do not disconnect socket to preserve session
        };
        // eslint-disable-next-line
    }, [fetchUsers, fetchMessages, user.secret]);

    // Send message or file
    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        setNotif(null);
        try {
            const formData = new FormData();
            formData.append("user", user.name);
            formData.append("role", user.role);
            formData.append("message", message);
            if (file && user.role === 0) formData.append("file", file);
            const res = await fetch(`${API_BASE}/api/message`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!data.status) setNotif({ type: "error", message: data.message });
            setMessage("");
            setFile(null);
        } catch {
            setNotif({ type: "error", message: "Failed to send message" });
        } finally {
            setLoading(false);
        }
    };

    // Delete user (admin only)
    const handleDeleteUser = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        setNotif(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/users/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secret: user.secret }),
            });
            const data = await res.json();
            if (data.status) fetchUsers();
            setNotif({ type: data.status ? "success" : "error", message: data.message });
        } catch {
            setNotif({ type: "error", message: "Failed to delete user" });
        } finally {
            setLoading(false);
        }
    };

    // Notification popup
    const Notification = () => (
        <AnimatePresence>
            {notif && (
                <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl text-white font-semibold ${notif.type === "error" ? "bg-red-500" : "bg-green-500"}`}
                >
                    {notif.message}
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Count active users
    const activeUsers = users.filter(u => u.active);

    // Show all active users in a modal
    const [showActive, setShowActive] = useState(false);

return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto mt-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-xl border border-white/10 p-4">
        {/* Active Users Modal */}
        <AnimatePresence>
            {showActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl w-full max-w-md relative text-white">
                        <button onClick={() => setShowActive(false)} className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl">×</button>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><UserCheck className="w-6 h-6" /> Active Users</h2>
                        <div className="flex flex-col gap-2">
                            {activeUsers.length === 0 ? <div className="text-gray-500">No active users.</div> : activeUsers.map(u => (
                                <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-800/30">
                                    <User className="w-4 h-4 inline" /> {u.name} <span className="text-xs px-2 py-0.5 rounded bg-white/10 ml-2">{u.role === 0 ? "Admin" : "User"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <Notification />

        {showRegister && user.role === 0 && (
            <RegisterUser adminSecret={user.secret} onSuccess={fetchUsers} onClose={() => setShowRegister(false)} />
        )}

        {/* User List */}
        <div className="bg-gray-800/60 rounded-2xl p-6 shadow-inner flex-1 min-w-[300px] border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6" /> All Users
                </h2>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowActive(true)} className="flex items-center gap-1 text-green-300 font-semibold hover:underline">
                        <UserCheck className="w-5 h-5" /> {activeUsers.length} active
                    </button>
                    {user.role === 0 && (
                        <button onClick={() => setShowRegister(true)} className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                            <UserPlus className="w-5 h-5" /> Register
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                {usersLoading ? (
                    <Skeleton count={7} height={32} baseColor="#1f1f1f" highlightColor="#444" />
                ) : users.length === 0 ? (
                    <div className="text-gray-400">No users found.</div>
                ) : (
                    users.map(u => (
                        <div key={u.id} className={`flex items-center justify-between px-3 py-2 rounded-xl ${u.role === 0 ? "bg-blue-900/40" : "bg-gray-700/30"}`} style={{ boxShadow: u.role === 0 ? "0 2px 12px #6c63ff33" : undefined }}>
                            <span className={`text-white font-medium flex items-center gap-2 ${u.active ? "" : "opacity-60"}`}>
                                <User className="w-4 h-4 inline" /> {u.name} <span className="text-xs px-2 py-0.5 rounded bg-white/10 ml-2">{u.role === 0 ? "Admin" : "User"}</span>
                                {u.active && <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block" title="Active"></span>}
                            </span>
                            {user.role === 0 && u.role !== 0 && (
                                <button onClick={() => handleDeleteUser(u.id)} className="p-1 hover:bg-red-500/70 rounded-full transition-colors"><Trash2 className="w-4 h-4 text-red-200" /></button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Chat Section */}
        <div className="flex-[2] bg-gray-800/70 rounded-2xl p-2 sm:p-4 md:p-6 shadow-inner border border-white/10 flex flex-col min-h-[400px] max-h-[90vh] w-full">
            <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-3 pr-2 max-h-[50vh] md:max-h-[500px] custom-scrollbar bg-gray-900/60 rounded-xl shadow-inner" id="chat-scroll">
                {msgLoading ? (
                    <Skeleton count={10} height={40} baseColor="#1f1f1f" highlightColor="#333" />
                ) : messages.length === 0 ? (
                    <div className="text-gray-400">No messages yet.</div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex items-start gap-3 p-2 sm:p-3 rounded-xl ${msg.role === 0 ? "bg-blue-900/40" : "bg-gray-700/30"}`} style={{ boxShadow: msg.role === 0 ? "0 2px 12px #6c63ff33" : undefined }}>
                            <span className="font-bold text-white flex items-center gap-2">
                                <User className="w-4 h-4 inline" /> {msg.user}
                                <span className="text-xs px-2 py-0.5 rounded bg-white/10 ml-2">{msg.role === 0 ? "Admin" : "User"}</span>
                            </span>
                            <span className="text-gray-200 flex-1">
                                {msg.type === "file" && msg.file ? (
                                    <div className="flex flex-col gap-1">
                                        {msg.file.mimeType?.startsWith("image/") ? (
                                            <img src={msg.file.url.startsWith("http") ? msg.file.url : `${API_BASE}${msg.file.url}`} alt={msg.file.name} className="max-h-40 rounded-lg border border-white/10 mb-1 object-contain" style={{ maxWidth: '100%' }} />
                                        ) : null}
                                        <div className="flex items-center gap-2">
                                            <a href={msg.file.url.startsWith("http") ? msg.file.url : `${API_BASE}${msg.file.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-300 hover:underline"><FileText className="w-4 h-4" /> {msg.file.name}</a>
                                            <a href={`${API_BASE}/api/files/${msg.id}/download`} download className="p-1 rounded hover:bg-blue-700/40 transition-colors" title="Download file"><Download className="w-4 h-4 text-blue-200" /></a>
                                        </div>
                                    </div>
                                ) : (
                                    msg.message
                                )}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="flex gap-2 mt-auto items-end w-full">
                <textarea
                    rows={1}
                    className="flex-1 px-4 py-2 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/10 resize-none min-h-[40px] max-h-40 custom-scrollbar shadow-inner"
                    placeholder="Type your message..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    disabled={loading}
                    required={!file}
                    style={{ overflowY: 'auto' }}
                    onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                    }}
                />
                {user.role === 0 && (
                    <>
                        <input
                            type="file"
                            className="hidden"
                            id="file-upload"
                            onChange={e => setFile(e.target.files[0])}
                            disabled={loading}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white px-3 py-2 rounded-2xl shadow hover:scale-105 transition-transform ml-1 flex items-center gap-1">
                            <FileText className="w-5 h-5 inline" />
                            {file && <span className="text-xs text-white/80 ml-1">{file.name}</span>}
                        </label>
                    </>
                )}
                <button type="submit" className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white font-bold px-4 py-2 rounded-2xl shadow hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2" disabled={loading || (!message && !file)}>
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />} Send
                </button>
            </form>

            <button onClick={onLogout} className="mt-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white font-bold py-2 px-6 rounded-2xl shadow hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                <LogOut className="w-5 h-5" /> Logout
            </button>
        </div>
    </div>
);

}