import React, { useState } from 'react';
import api from '../api';

const AddSoftwareForm = () => {
    const [formData, setFormData] = useState({
        brandName: '',
        productType: '',
        systemName: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.post('/software', formData);
            setStatus({ type: 'success', message: 'Software successfully added!' });
            setFormData({ brandName: '', productType: '', systemName: '' });
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to add software' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600">
                Add New Software
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all bg-white/50"
                        placeholder="e.g. Adobe"
                        value={formData.brandName}
                        onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all bg-white/50"
                        placeholder="e.g. Photo Editor"
                        value={formData.productType}
                        onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all bg-white/50"
                        placeholder="e.g. Photoshop 2024"
                        value={formData.systemName}
                        onChange={e => setFormData({ ...formData, systemName: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Note: This will be added if the schema supports it.</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded-xl text-white font-semibold shadow-lg transform transition-all hover:-translate-y-0.5 ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:shadow-pink-500/30'
                        }`}
                >
                    {loading ? 'Processing...' : 'Add Software System'}
                </button>

                {status.message && (
                    <div className={`p-4 rounded-xl ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {status.message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddSoftwareForm;
