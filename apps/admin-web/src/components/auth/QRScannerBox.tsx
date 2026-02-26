import React from 'react';

interface QRScannerBoxProps {
    qrImageUrl: string;
    sessionTimeout?: string;
    onScanSuccess?: () => void;
}

const QRScannerBox: React.FC<QRScannerBoxProps> = ({ qrImageUrl, sessionTimeout, onScanSuccess }) => {
    return (
        <div className="flex flex-col items-center w-full max-w-sm">

            {/* QR Scanning Frame */}
            <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Tech Viewfinder Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400"></div>

                {/* Actual QR Image Container (Must be white for scanning) */}
                <div className="bg-white p-4 rounded-sm shadow-lg w-[85%] h-[85%] flex items-center justify-center group relative">
                    <img
                        src={qrImageUrl}
                        alt="Authentication QR Code"
                        className="w-full h-full object-contain"
                    />
                    {/* Overlay for simulation */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={onScanSuccess}>
                        <span className="text-white font-bold text-sm bg-cyan-600 px-3 py-1 rounded">Simulate Scan</span>
                    </div>
                </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-10 flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </div>
                    <span className="text-gray-300 font-medium tracking-wide">Waiting for scan...</span>
                </div>

                {sessionTimeout && (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                        SESSION EXPIRES IN {sessionTimeout}
                    </p>
                )}
            </div>

            {/* Settings */}
            <div className="mt-12 w-full pt-8 border-t border-gray-800 flex justify-center">
                <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900 cursor-pointer"
                        defaultChecked
                    />
                    <span className="text-gray-400 font-medium group-hover:text-gray-200 transition-colors">
                        Keep me signed in
                    </span>
                </label>
            </div>
        </div>
    );
};

export default QRScannerBox;
