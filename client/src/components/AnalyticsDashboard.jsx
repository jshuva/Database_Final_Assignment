import React, { useState, useEffect } from 'react';
import api from '../api';

const AnalyticsDashboard = () => {
    const [limit, setLimit] = useState(5);
    const [data, setData] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            api.get(`/analytics/top?limit=${limit}`),
            api.get('/analytics/insights')
        ])
            .then(([topRes, insightsRes]) => {
                setData(topRes.data);
                setInsights(insightsRes.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [limit]);

    return (
        <div className="flex flex-col gap-6 h-full overflow-hidden">

            {/* Top Section: Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-shrink-0">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
                    <h3 className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Best Brand</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold truncate block">{insights?.bestBrand?.BrandName || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-1">Highest Avg Score: {insights?.bestBrand?.AvgScore ? parseFloat(insights?.bestBrand?.AvgScore).toFixed(1) : '-'}</p>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg">
                    <h3 className="text-pink-100 text-sm font-medium uppercase tracking-wider">Most Critical User</h3>
                    <div className="mt-2 truncate" title={insights?.criticalUser?.UserPseudoEmail}>
                        <span className="text-lg font-bold block truncate">
                            {insights?.criticalUser?.UserPseudoEmail ? insights.criticalUser.UserPseudoEmail.substring(0, 8) + '...' : 'N/A'}
                        </span>
                    </div>
                    <p className="text-xs text-pink-200 mt-1">
                        Lowest Avg Score: {insights?.criticalUser?.AvgScore ? parseFloat(insights?.criticalUser?.AvgScore).toFixed(1) : '-'}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                    <h3 className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Popular Category</h3>
                    <div className="mt-2">
                        <span className="text-2xl font-bold truncate block">{insights?.popularCategory?.TypeName || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-emerald-200 mt-1">
                        {insights?.popularCategory?.ReviewCount || 0} total reviews
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 text-white shadow-lg">
                    <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Reviews</h3>
                    <div className="mt-2">
                        <span className="text-3xl font-bold">{insights?.totalReviews !== undefined ? insights.totalReviews : '-'}</span>
                    </div>
                    <p className="text-xs text-blue-200 mt-1">System-wide volume</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
                    <h3 className="text-amber-100 text-sm font-medium uppercase tracking-wider">Market Avg</h3>
                    <div className="mt-2">
                        <span className="text-3xl font-bold">{insights?.marketAverage ? parseFloat(insights.marketAverage).toFixed(1) : '-'}</span>
                    </div>
                    <p className="text-xs text-amber-200 mt-1">Global satisfaction score</p>
                </div>
            </div>

            {/* Main Content: Top Rated */}
            <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 flex-1 overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">
                            Market Performance Leaders
                        </h2>
                        <p className="text-sm text-gray-500">Top performing software based on user evaluations.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Top N:</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                className="w-12 p-1 rounded border border-gray-300 text-center text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.map((item, index) => (
                                <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-inner ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">{item.BrandName}</h3>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{item.TypeName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            {/* Current Score */}
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-gray-800">
                                                    {item.AverageScore ? parseFloat(item.AverageScore).toFixed(1) : 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium uppercase">Average Score</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar Visualization */}
                                    <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(parseFloat(item.AverageScore) / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}

                            {data.length === 0 && (
                                <div className="text-center text-gray-500 py-12">
                                    No data available for analysis.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
