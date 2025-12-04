import React, { useState, useEffect } from 'react';
import api from '../api';

const TableViewer = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        api.get('/tables').then(res => setTables(res.data)).catch(console.error);
    }, []);

    const fetchData = () => {
        if (selectedTable) {
            setLoading(true);
            // Use special endpoint for SoftwareSystem to get rich data, otherwise generic
            const endpoint = selectedTable === 'SoftwareSystem' ? '/software' : `/tables/${selectedTable}`;

            api.get(endpoint)
                .then(res => setData(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchData();
        // Reset edit state when table changes
        setEditingId(null);
        setEditForm({});
    }, [selectedTable]);

    // CRUD Operations
    const handleDelete = async (row) => {
        // Only support deleting SoftwareSystem for now as it has a specific API
        if (selectedTable !== 'SoftwareSystem') {
            alert('Deletion is currently only supported for the SoftwareSystem table.');
            return;
        }

        if (!window.confirm('⚠️ WARNING: Deleting this software system will PERMANENTLY DELETE all associated evaluations and data.\n\nAre you sure you want to proceed?')) return;

        try {
            await api.delete(`/software/${row.SystemID}`);
            fetchData();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to delete';
            const errorDetails = err.response?.data?.details || '';
            alert(`Error: ${errorMessage}\n${errorDetails}`);
        }
    };

    const startEdit = (row) => {
        if (selectedTable !== 'SoftwareSystem') {
            alert('Editing is currently only supported for the SoftwareSystem table.');
            return;
        }
        setEditingId(row.SystemID);
        // Pre-fill form with current values
        setEditForm({ brandName: row.BrandName, productType: row.TypeName });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/software/${id}`, editForm);
            setEditingId(null);
            fetchData();
        } catch (err) {
            alert('Failed to update software');
            console.error(err);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Database Explorer
            </h2>
            <div className="mb-6">
                <select
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm hover:shadow-md cursor-pointer"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                >
                    <option value="">Select a Table</option>
                    {tables.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="overflow-auto rounded-xl border border-gray-200 shadow-inner flex-1">
                        {data.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        {Object.keys(data[0]).map(key => (
                                            <th key={key} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                {key}
                                            </th>
                                        ))}
                                        {/* Add Actions Column if SoftwareSystem */}
                                        {selectedTable === 'SoftwareSystem' && (
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.map((row, i) => (
                                        <tr key={i} className="hover:bg-indigo-50 transition-colors duration-150">
                                            {/* Render Cells */}
                                            {Object.entries(row).map(([key, val], j) => (
                                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {/* Inline Edit Logic for SoftwareSystem */}
                                                    {editingId === row.SystemID && selectedTable === 'SoftwareSystem' ? (
                                                        key === 'BrandName' ? (
                                                            <input
                                                                className="p-1 border rounded w-full"
                                                                value={editForm.brandName}
                                                                onChange={e => setEditForm({ ...editForm, brandName: e.target.value })}
                                                            />
                                                        ) : key === 'TypeName' ? (
                                                            <input
                                                                className="p-1 border rounded w-full"
                                                                value={editForm.productType}
                                                                onChange={e => setEditForm({ ...editForm, productType: e.target.value })}
                                                            />
                                                        ) : (
                                                            val // Non-editable fields like ID
                                                        )
                                                    ) : (
                                                        val
                                                    )}
                                                </td>
                                            ))}

                                            {/* Render Actions Buttons */}
                                            {selectedTable === 'SoftwareSystem' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {editingId === row.SystemID ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleUpdate(row.SystemID)} className="text-green-600 hover:text-green-900">
                                                                Save
                                                            </button>
                                                            <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-900">
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => startEdit(row)} className="text-indigo-600 hover:text-indigo-900">
                                                                Edit
                                                            </button>
                                                            <button onClick={() => handleDelete(row)} className="text-red-600 hover:text-red-900">
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                                <p className="text-lg">{selectedTable ? 'No data found' : 'Select a table to view data'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableViewer;
