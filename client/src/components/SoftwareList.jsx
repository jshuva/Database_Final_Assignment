import React, { useState, useEffect } from 'react';
import api from '../api';

const SoftwareList = () => {
    const [software, setSoftware] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ brandName: '', productType: '' });
    const [loading, setLoading] = useState(false);

    const fetchSoftware = () => {
        setLoading(true);
        api.get('/software')
            .then(res => setSoftware(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSoftware();
        // Poll every 5 seconds to keep list updated if new items are added via the other form
        const interval = setInterval(fetchSoftware, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id) => {
        // Stronger warning for relational integrity awareness
        if (!window.confirm('⚠️ WARNING: Deleting this software system will PERMANENTLY DELETE all associated evaluations and data.\n\nAre you sure you want to proceed?')) return;

        try {
            await api.delete(`/software/${id}`);
            fetchSoftware();
        } catch (err) {
            // Handle specific integrity errors from backend
            const errorMessage = err.response?.data?.error || 'Failed to delete software';
            const errorDetails = err.response?.data?.details || '';
            alert(`Error: ${errorMessage}\n${errorDetails}`);
            console.error(err);
        }
    };

    const startEdit = (item) => {
        setEditingId(item.SystemID);
        setEditForm({ brandName: item.BrandName, productType: item.TypeName });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ brandName: '', productType: '' });
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/software/${id}`, editForm);
            setEditingId(null);
            fetchSoftware();
        } catch (err) {
            alert('Failed to update software');
            console.error(err);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                Manage Software
            </h2>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {loading && software.length === 0 ? (
                    <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {software.map((item) => (
                            <div key={item.SystemID} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                {editingId === item.SystemID ? (
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                            className="p-2 border rounded-lg text-sm w-1/3 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={editForm.brandName}
                                            onChange={e => setEditForm({ ...editForm, brandName: e.target.value })}
                                            placeholder="Brand"
                                        />
                                        <input
                                            className="p-2 border rounded-lg text-sm w-1/3 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={editForm.productType}
                                            onChange={e => setEditForm({ ...editForm, productType: e.target.value })}
                                            placeholder="Type"
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={() => handleUpdate(item.SystemID)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                            <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{item.BrandName}</h3>
                                            <p className="text-sm text-gray-500">{item.TypeName}</p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.SystemID)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {software.length === 0 && !loading && (
                            <div className="text-center text-gray-400 py-8">No software found</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SoftwareList;
