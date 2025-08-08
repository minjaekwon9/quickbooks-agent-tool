'use client';
import React, { useState, useEffect } from 'react';

const CompanyPage = () => {
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCompanyName = async () => {
            try {
                const response = await fetch('/api/quickbooks/company');
                const data = await response.json();

                if (data.success) {
                    setCompanyName(data.companyName);
                } else {
                    setError('Failed to load company name');
                }
            } catch (err) {
                setError('Unable to connect to QuickBooks');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyName();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-xl text-red-600 mb-2">Error</div>
                    <div className="text-gray-600">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {companyName}
                </h1>
                <p className="text-gray-600">QuickBooks Company</p>
            </div>
        </div>
    );
};

export default CompanyPage;