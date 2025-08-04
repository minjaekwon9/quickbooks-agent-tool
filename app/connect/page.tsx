'use client';

import { useEffect, useState } from 'react';

export default function ConnectPage() {
    const [authUri, setAuthUri] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/quickbooks')
            .then((res) => res.json())
            .then((data) => setAuthUri(data.authUri));
    }, []);

    // Render the connect page with a link to QuickBooks OAuth
    return (
        <div>
            <h1>Connect with QuickBooks</h1>
            {authUri ? (
                <a href={authUri}>Connect Now</a>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}
