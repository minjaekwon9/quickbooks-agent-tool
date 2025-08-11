'use client';
import React, { useState, useEffect } from 'react';

interface QuickBooksInvoice {
    Id: string;
    DocNumber: string;
    TotalAmt: number;
    SyncToken: string;
    CustomerRef: {
        value: string;
        name?: string;
    };
    Line: InvoiceLine[];
    [key: string]: any; // For other QB fields
}

interface InvoiceLine {
    Amount: number;
    DetailType: string;
    SalesItemLineDetail: {
        ItemRef: {
            value: string;
            name: string;
        };
    };
}

interface InvoiceFormData {
    CustomerRef: {
        value: string;
    };
    Line: InvoiceLine[];
}

interface ApiResponse {
    success: boolean;
    error?: string;
    invoice?: QuickBooksInvoice;
    invoices?: QuickBooksInvoice[];
    companyName?: string;
    [key: string]: any;
}

const CompanyPage: React.FC = () => {
    const [companyName, setCompanyName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Invoice states
    const [invoices, setInvoices] = useState<QuickBooksInvoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<QuickBooksInvoice | null>(null);
    const [invoiceId, setInvoiceId] = useState<string>('');
    const [criteria, setCriteria] = useState<string>('');
    const [apiResponse, setApiResponse] = useState<string>('');
    const [apiLoading, setApiLoading] = useState<boolean>(false);

    // Form data for creating/updating invoices
    const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
        CustomerRef: { value: '1' },
        Line: [{
            Amount: 100.00,
            DetailType: 'SalesItemLineDetail',
            SalesItemLineDetail: {
                ItemRef: { value: '1', name: 'Services' }
            }
        }]
    });

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

    const handleApiCall = async (
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: string,
        body: any = null
    ): Promise<void> => {
        setApiLoading(true);
        setApiResponse('');

        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response: Response = await fetch(url, options);

            // Check if response is OK
            if (!response.ok) {
                const errorText = await response.text();
                setApiResponse(`HTTP Error ${response.status}: ${response.statusText}\n\nResponse: ${errorText}`);
                return;
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                setApiResponse(`Error: Expected JSON but received ${contentType}\n\nResponse: ${responseText}`);
                return;
            }

            const data: ApiResponse = await response.json();

            setApiResponse(JSON.stringify(data, null, 2));

            if (data.success) {
                if (data.invoices) {
                    setInvoices(data.invoices);
                    setSelectedInvoice(null); // Clear selected invoice when showing multiple
                } else if (data.invoice) {
                    setSelectedInvoice(data.invoice);
                    setInvoices([]); // Clear invoices list when showing single invoice
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setApiResponse(`Error: ${errorMessage}`);
        } finally {
            setApiLoading(false);
        }
    };

    const getAllInvoices = (): void => {
        handleApiCall('GET', '/api/quickbooks/invoice');
    };

    const getInvoiceById = (): void => {
        if (!invoiceId) {
            setApiResponse('Please enter an invoice ID');
            return;
        }
        // Clear existing invoices list when searching by ID
        setInvoices([]);
        setSelectedInvoice(null);
        handleApiCall('GET', `/api/quickbooks/invoice?id=${invoiceId}`);
    };

    const getInvoicesByCriteria = (): void => {
        // Clear existing data when searching with criteria
        setInvoices([]);
        setSelectedInvoice(null);
        const url: string = criteria
            ? `/api/quickbooks/invoice?criteria=${encodeURIComponent(criteria)}`
            : '/api/quickbooks/invoice';
        handleApiCall('GET', url);
    };

    const createInvoice = (): void => {
        handleApiCall('POST', '/api/quickbooks/invoice', invoiceData);
    };

    const updateInvoice = (): void => {
        if (!selectedInvoice) {
            setApiResponse('Please select an invoice first by getting one by ID');
            return;
        }

        const updatedData: QuickBooksInvoice = {
            ...selectedInvoice,
            ...invoiceData,
            Id: selectedInvoice.Id,
            SyncToken: selectedInvoice.SyncToken
        };

        handleApiCall('PUT', '/api/quickbooks/invoice', updatedData);
    };

    const deleteInvoice = (): void => {
        if (!invoiceId) {
            setApiResponse('Please enter an invoice ID');
            return;
        }
        handleApiCall('DELETE', `/api/quickbooks/invoice?id=${invoiceId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-xl text-gray-300">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="text-xl text-red-400 mb-2">Error</div>
                    <div className="text-gray-300">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Company Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {companyName}
                    </h1>
                    <p className="text-gray-400 text-lg">QuickBooks Invoice API Testing</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Controls */}
                    <div className="space-y-6">
                        {/* Get Invoices Section */}
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-white">Get Invoices</h2>

                            <div className="space-y-4">
                                <button
                                    onClick={getAllInvoices}
                                    disabled={apiLoading}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                                >
                                    Get All Invoices
                                </button>

                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Invoice ID"
                                        value={invoiceId}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceId(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                    <button
                                        onClick={getInvoiceById}
                                        disabled={apiLoading}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                                    >
                                        Get by ID
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Key = Value (e.g. Name = Dog Food Company)"
                                        value={criteria}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCriteria(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                                    />
                                    <button
                                        onClick={getInvoicesByCriteria}
                                        disabled={apiLoading}
                                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                                    >
                                        Search with Criteria
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Create/Update Invoice Section */}
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-white">Create/Update Invoice</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">Customer ID</label>
                                    <input
                                        type="text"
                                        value={invoiceData.CustomerRef.value}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceData({
                                            ...invoiceData,
                                            CustomerRef: { value: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={invoiceData.Line[0].Amount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceData({
                                            ...invoiceData,
                                            Line: [{
                                                ...invoiceData.Line[0],
                                                Amount: parseFloat(e.target.value) || 0
                                            }]
                                        })}
                                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">Item Name</label>
                                    <input
                                        type="text"
                                        value={invoiceData.Line[0].SalesItemLineDetail.ItemRef.name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceData({
                                            ...invoiceData,
                                            Line: [{
                                                ...invoiceData.Line[0],
                                                SalesItemLineDetail: {
                                                    ...invoiceData.Line[0].SalesItemLineDetail,
                                                    ItemRef: {
                                                        ...invoiceData.Line[0].SalesItemLineDetail.ItemRef,
                                                        name: e.target.value
                                                    }
                                                }
                                            }]
                                        })}
                                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={createInvoice}
                                        disabled={apiLoading}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                                    >
                                        Create Invoice
                                    </button>
                                    <button
                                        onClick={updateInvoice}
                                        disabled={apiLoading}
                                        className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                                    >
                                        Update Invoice
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Delete Invoice Section */}
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-white">Delete Invoice</h2>
                            <button
                                onClick={deleteInvoice}
                                disabled={apiLoading}
                                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                            >
                                Delete Invoice (uses ID from above)
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Response */}
                    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h2 className="text-xl font-semibold text-white">API Response</h2>
                            {apiLoading && (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                    <div className="text-blue-400 font-medium">Loading...</div>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono border border-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                {apiResponse || 'Click a button to test the API'}
                            </pre>

                            {(invoices.length > 0 || selectedInvoice) && (
                                <div className="mt-6">
                                    {invoices.length > 0 && (
                                        <>
                                            <h3 className="font-semibold mb-3 text-white text-lg">
                                                Invoices ({invoices.length})
                                            </h3>
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {invoices.map((invoice, index) => (
                                                    <div key={index} className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-650 transition-colors">
                                                        <div className="text-gray-300">
                                                            <div className="mb-1">
                                                                <span className="font-medium text-white">ID:</span>
                                                                <span className="ml-2 text-blue-400 font-mono">{invoice.Id}</span>
                                                            </div>
                                                            <div className="mb-1">
                                                                <span className="font-medium text-white">Doc Number:</span>
                                                                <span className="ml-2">{invoice.DocNumber}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-white">Total:</span>
                                                                <span className="ml-2 text-green-400 font-semibold">${invoice.TotalAmt}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {selectedInvoice && (
                                        <>
                                            <h3 className="font-semibold mb-3 text-white text-lg">
                                                Selected Invoice
                                            </h3>
                                            <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                                                <div className="text-gray-300 space-y-2">
                                                    <div>
                                                        <span className="font-medium text-white">ID:</span>
                                                        <span className="ml-2 text-blue-400 font-mono">{selectedInvoice.Id}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-white">Doc Number:</span>
                                                        <span className="ml-2">{selectedInvoice.DocNumber}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-white">Total:</span>
                                                        <span className="ml-2 text-green-400 font-semibold">${selectedInvoice.TotalAmt}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-white">Sync Token:</span>
                                                        <span className="ml-2 text-purple-400 font-mono">{selectedInvoice.SyncToken}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-white">Customer:</span>
                                                        <span className="ml-2">{selectedInvoice.CustomerRef.name || selectedInvoice.CustomerRef.value}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyPage;