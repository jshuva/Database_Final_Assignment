import React, { useState, useEffect } from 'react';
import api from '../api';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [softwareList, setSoftwareList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Form State
    const [formData, setFormData] = useState({
        userId: '',
        systemId: '',
        friendliness: 5,
        price: 0,
        features: 5,
        accuracy: 5
    });

    // Edit State
    const [editingId, setEditingId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reviewsRes, usersRes, softwareRes] = await Promise.all([
                api.get('/evaluations'),
                api.get('/users/raw'), // Use raw endpoint for dropdowns to ensure we have IDs
                api.get('/software')
            ]);
            setReviews(reviewsRes.data);
            setUsers(usersRes.data);
            setSoftwareList(softwareRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        try {
            if (editingId) {
                await api.put(`/evaluations/${editingId}`, formData);
                setStatus({ type: 'success', message: 'Review updated successfully!' });
                setEditingId(null);
            } else {
                await api.post('/evaluations', formData);
                setStatus({ type: 'success', message: 'Review submitted successfully!' });
            }
            // Reset form
            setFormData({ userId: '', systemId: '', friendliness: 5, price: 0, features: 5, accuracy: 5 });
            fetchData();
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to save review' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            await api.delete(`/evaluations/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete review');
        }
    };

    const startEdit = (review) => {
        setEditingId(review.EvaluationID);
        setFormData({
            userId: review.UserID,
            systemId: review.SystemID,
            friendliness: review.Friendliness,
            price: review.Price,
            features: review.Features,
            accuracy: review.Accuracy
        });
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ userId: '', systemId: '', friendliness: 5, price: 0, features: 5, accuracy: 5 });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Add/Edit Review Form */}
            <div className="lg:col-span-4 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 h-fit">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        {editingId ? 'Edit Review' : 'Submit New Review'}
                    </h2>
                    {editingId && (
                        <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700 underline">Cancel</button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer</label>
                        <select
                            required
                            disabled={!!editingId} // Disable user/software change during edit to simplify logic
                            className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm ${editingId ? 'bg-gray-100' : ''}`}
                            value={formData.userId}
                            onChange={e => setFormData({ ...formData, userId: e.target.value })}
                        >
                            <option value="">Select User</option>
                            {users.map(u => (
                                <option key={u.UserID} value={u.UserID}>
                                    {u.UserPseudoEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')} (ID: {u.UserID})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Software</label>
                        <select
                            required
                            disabled={!!editingId}
                            className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm ${editingId ? 'bg-gray-100' : ''}`}
                            value={formData.systemId}
                            onChange={e => setFormData({ ...formData, systemId: e.target.value })}
                        >
                            <option value="">Select Software</option>
                            {softwareList.map(s => (
                                <option key={s.SystemID} value={s.SystemID}>
                                    {s.BrandName} - {s.TypeName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Friendliness (1-10)</label>
                            <input type="number" min="1" max="10" required
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.friendliness}
                                onChange={e => setFormData({ ...formData, friendliness: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Features (1-10)</label>
                            <input type="number" min="1" max="10" required
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.features}
                                onChange={e => setFormData({ ...formData, features: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Accuracy (1-10)</label>
                            <input type="number" min="1" max="10" required
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.accuracy}
                                onChange={e => setFormData({ ...formData, accuracy: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                            <input type="number" min="0" step="0.01"
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-3 px-4 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium ${editingId ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                            }`}
                    >
                        {editingId ? 'Update Review' : 'Submit Review'}
                    </button>

                    {status.message && (
                        <div className={`p-3 rounded-xl text-sm border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {status.message}
                        </div>
                    )}
                </form>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-8 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/20 flex flex-col h-[600px]">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Reviews</h2>
                <div className="flex-1 overflow-auto custom-scrollbar pr-2">
                    {loading && reviews.length === 0 ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <div key={review.EvaluationID} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{review.BrandName} <span className="text-gray-300 font-light mx-1">|</span> <span className="text-gray-600">{review.TypeName}</span></h3>
                                            <p className="text-xs text-gray-500 mt-1">Reviewed by: <span className="font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{review.UserPseudoEmail}</span></p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-xs text-gray-400 font-mono">
                                                {new Date(review.EvaluationTimestamp).toLocaleDateString()}
                                            </span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(review)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100">Edit</button>
                                                <button onClick={() => handleDelete(review.EvaluationID)} className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 mt-4">
                                        <ScoreBadge label="Friendliness" score={review.Friendliness} />
                                        <ScoreBadge label="Features" score={review.Features} />
                                        <ScoreBadge label="Accuracy" score={review.Accuracy} />
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 text-center border border-gray-100">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Price</div>
                                            <div className="font-bold text-gray-700 text-lg">${review.Price}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {reviews.length === 0 && !loading && (
                                <div className="text-center text-gray-400 py-8">No reviews found</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ScoreBadge = ({ label, score }) => {
    let colorClass = 'text-red-600 bg-red-50 border-red-100';
    if (score >= 8) colorClass = 'text-green-600 bg-green-50 border-green-100';
    else if (score >= 5) colorClass = 'text-yellow-600 bg-yellow-50 border-yellow-100';

    return (
        <div className={`rounded-xl p-2 text-center border ${colorClass}`}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-80">{label}</div>
            <div className="font-bold text-lg">
                {score}<span className="text-xs opacity-60">/10</span>
            </div>
        </div>
    );
};

export default ReviewManagement;
