import React, { useState, useEffect } from 'react';
import api from '../api';

const AddSoftwareForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        brandName: '',
        productType: ''
    });
    const [productTypes, setProductTypes] = useState([]);
    const [isCustomType, setIsCustomType] = useState(false);
    const [customType, setCustomType] = useState('');

    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProductTypes();
    }, []);

    const fetchProductTypes = () => {
        api.get('/product-types')
            .then(res => setProductTypes(res.data))
            .catch(console.error);
    };

    const handleTypeChange = (e) => {
        const value = e.target.value;
        if (value === 'OTHER_CUSTOM_TYPE') {
            setIsCustomType(true);
            setFormData({ ...formData, productType: '' });
        } else {
            setIsCustomType(false);
            setFormData({ ...formData, productType: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const finalProductType = isCustomType ? customType : formData.productType;

        if (!finalProductType.trim()) {
            setStatus({ type: 'error', message: 'Product Type is required' });
            setLoading(false);
            return;
        }

        try {
            await api.post('/software', {
                brandName: formData.brandName,
                productType: finalProductType
            });
            setStatus({ type: 'success', message: 'Software successfully added!' });
            // Reset form
            setFormData({ brandName: '', productType: '' });
            setCustomType('');
            setIsCustomType(false);
            // Refresh types in case a new one was added
            fetchProductTypes();
            if (onSuccess) onSuccess();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to add software';
            const details = err.response?.data?.details || '';
            setStatus({ type: 'error', message: details ? `${errorMsg}: ${details}` : errorMsg });
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
                    <select
                        required
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all bg-white/50 mb-2"
                        value={isCustomType ? 'OTHER_CUSTOM_TYPE' : formData.productType}
                        onChange={handleTypeChange}
                    >
                        <option value="">Select Product Type</option>
                        {productTypes.map(pt => (
                            <option key={pt.ProductTypeID} value={pt.TypeName}>{pt.TypeName}</option>
                        ))}
                        <option value="OTHER_CUSTOM_TYPE" className="font-bold text-indigo-600">+ Add New Type (Others)</option>
                    </select>

                    {isCustomType && (
                        <div className="animate-fade-in-down">
                            <input
                                type="text"
                                required
                                autoFocus
                                className="w-full p-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-indigo-50/50"
                                placeholder="Enter new product type name..."
                                value={customType}
                                onChange={e => setCustomType(e.target.value)}
                            />
                        </div>
                    )}
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
                    <div className={`p-4 rounded-xl text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {status.message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddSoftwareForm;
