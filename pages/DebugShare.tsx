import React from 'react';
import { useLocation, useParams } from 'react-router-dom';

const DebugPage: React.FC = () => {
    const location = useLocation();
    const params = useParams();

    return (
        <div className="p-8 font-mono">
            <h1 className="text-xl font-bold mb-4">Routing Debugger</h1>
            <div className="bg-gray-100 p-4 rounded">
                <p>Pathname: {location.pathname}</p>
                <p>Params: {JSON.stringify(params)}</p>
                <p>Timestamp: {new Date().toISOString()}</p>
            </div>
        </div>
    );
};

export default DebugPage;
