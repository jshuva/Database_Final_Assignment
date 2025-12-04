import React, { useState, useEffect } from 'react';
import api from '../api';

const AnalyticsDashboard = () => {
    const [limit, setLimit] = useState(5);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = () => {
        setLoading(true);
        api.get(`/analytics/top?limit=${limit}`)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [limit]);

    return (
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                    Top Rated Software
                </h2>
                <div className="flex items-center space-x-2 bg-white/50 p-1 rounded-lg border border-gray-200">
                    <label className="text-sm font-medium text-gray-600 pl-2">Show Top:</label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        className="w-16 p-1 rounded-md border-none bg-transparent text-center focus:ring-0 outline-none font-bold text-emerald-700"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.map((item, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-inner">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{item.BrandName}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{item.TypeName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {item.AverageScore ? parseFloat(item.AverageScore).toFixed(1) : 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Score</div>
                                </div>
                            </div>
                        ))}
                        {data.length === 0 && (
                            <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                No rankings available
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
