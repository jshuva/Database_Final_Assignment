import React, { useState, useEffect } from 'react';
import api from '../api';

const TableViewer = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/tables').then(res => setTables(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedTable) {
            setLoading(true);
            api.get(`/tables/${selectedTable}`)
                .then(res => setData(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [selectedTable]);

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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.map((row, i) => (
                                        <tr key={i} className="hover:bg-indigo-50 transition-colors duration-150">
                                            {Object.values(row).map((val, j) => (
                                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {val}
                                                </td>
                                            ))}
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
