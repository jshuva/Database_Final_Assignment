import React, { useState, useEffect } from 'react';
import api from '../api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Edit State
    const [editingId, setEditingId] = useState(null);
    const [editEmail, setEditEmail] = useState('');

    const fetchUsers = () => {
        setLoading(true);
        api.get('/users')
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        try {
            await api.post('/users', { email });
            setStatus({ type: 'success', message: 'User added successfully!' });
            setEmail('');
            fetchUsers();
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to add user' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to delete user';
            const errorDetails = err.response?.data?.details || '';
            alert(`Error: ${errorMessage}\n${errorDetails}`);
        }
    };

    const startEdit = (user) => {
        setEditingId(user.UserID);
        setEditEmail('');
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/users/${id}`, { email: editEmail });
            setEditingId(null);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update user');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Add User Form */}
            <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Add New Reviewer
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Emails will be masked for privacy in the list.</p>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium"
                    >
                        Add User
                    </button>
                    {status.message && (
                        <div className={`p-3 rounded-xl text-sm border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {status.message}
                        </div>
                    )}
                </form>
            </div>

            {/* User List */}
            <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 flex flex-col h-[600px]">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Registered Reviewers</h2>
                <div className="flex-1 overflow-auto custom-scrollbar pr-2">
                    {loading && users.length === 0 ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {users.map(user => (
                                <li key={user.UserID} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-inner">
                                            {user.UserID}
                                        </div>
                                        {editingId === user.UserID ? (
                                            <input
                                                className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="Enter new email..."
                                                value={editEmail}
                                                onChange={e => setEditEmail(e.target.value)}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-gray-700 font-medium">{user.UserPseudoEmail}</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingId === user.UserID ? (
                                            <>
                                                <button onClick={() => handleUpdate(user.UserID)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(user)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit Email">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(user.UserID)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete User">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {users.length === 0 && !loading && (
                                <div className="text-center text-gray-400 py-8">No users found</div>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
