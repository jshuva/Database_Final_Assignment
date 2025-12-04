import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, LabelList
} from 'recharts';

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

    // Prepare data for charts
    const radarData = insights?.attributeAverages ? [
        { subject: 'Friendliness', A: parseFloat(insights.attributeAverages.Friendliness).toFixed(2), fullMark: 10 },
        { subject: 'Price', A: parseFloat(insights.attributeAverages.Price).toFixed(2), fullMark: 10 },
        { subject: 'Features', A: parseFloat(insights.attributeAverages.Features).toFixed(2), fullMark: 10 },
        { subject: 'Accuracy', A: parseFloat(insights.attributeAverages.Accuracy).toFixed(2), fullMark: 10 },
    ] : [];

    const barData = insights?.scoreDistribution ? Object.entries(insights.scoreDistribution).map(([score, count]) => ({
        name: `${score}★`,
        count: count
    })) : [];

    const pieData = insights?.categoryDistribution ? insights.categoryDistribution.map(item => ({
        name: item.name,
        value: item.value
    })) : [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="flex flex-col gap-6">

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
                    <h3 className="text-pink-100 text-sm font-medium uppercase tracking-wider">Top Category</h3>
                    <div className="mt-2">
                        <span className="text-2xl font-bold truncate block">
                            {insights?.topCategory?.TypeName || 'N/A'}
                        </span>
                    </div>
                    <p className="text-xs text-pink-200 mt-1">
                        Highest Avg Score: {insights?.topCategory?.AvgScore ? parseFloat(insights?.topCategory?.AvgScore).toFixed(1) : '-'}
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Market Performance Leaders */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 flex flex-col">
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

                    <div className="mt-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.map((item, index) => (
                                    <div key={index} className="relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                        {/* Decorative background element */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        <div className="relative z-10 flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-5">
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm border-2 ${index === 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                                                        index === 1 ? 'bg-gray-50 border-gray-200 text-gray-600' :
                                                            index === 2 ? 'bg-orange-50 border-orange-200 text-orange-600' :
                                                                'bg-indigo-50 border-indigo-100 text-indigo-600'
                                                    }`}>
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg tracking-tight group-hover:text-indigo-700 transition-colors">{item.BrandName}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                                            {item.TypeName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="flex items-baseline justify-end gap-1">
                                                    <span className="text-3xl font-black text-gray-800 tracking-tight">
                                                        {item.AverageScore ? parseFloat(item.AverageScore).toFixed(1) : 'N/A'}
                                                    </span>
                                                    <span className="text-sm text-gray-400 font-medium">/ 10</span>
                                                </div>
                                                <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mt-0.5">Average Score</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar Visualization */}
                                        <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                                                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                                                                'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                                                    }`}
                                                style={{ width: `${(parseFloat(item.AverageScore) / 10) * 100}%` }}
                                            >
                                                {/* Shine effect */}
                                                <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Analytics & Trends */}
                <div className="lg:col-span-1 flex flex-col gap-6">

                    {/* Radar Chart: Attribute Performance */}
                    <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-4 border border-white/20">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider border-b pb-2">Attribute Analysis</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Market Avg"
                                        dataKey="A"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="#818cf8"
                                        fillOpacity={0.5}
                                        label={({ x, y, value }) => (
                                            <text
                                                x={x}
                                                y={y}
                                                dy={-4}
                                                fill="#1e1b4b"
                                                fontSize={12}
                                                fontWeight={800}
                                                textAnchor="middle"
                                                stroke="#ffffff"
                                                strokeWidth={3}
                                                paintOrder="stroke"
                                            >
                                                {value}
                                            </text>
                                        )}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart: Category Distribution */}
                    <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-4 border border-white/20">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider border-b pb-2">Category Share</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs font-medium text-gray-600">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: Score Distribution */}
                    <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-4 border border-white/20">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider border-b pb-2">Score Distribution</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="url(#colorCount)" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="count" position="top" fontSize={10} fill="#6b7280" formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
