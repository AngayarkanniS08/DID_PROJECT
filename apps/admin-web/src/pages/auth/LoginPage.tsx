import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginInstructions from '../../components/auth/LoginInstructions';
import QRScannerBox from '../../components/auth/QRScannerBox';
import { authService } from '../../services/auth.service';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    // 1. New State for the Toggle and Form
    const [loginMethod, setLoginMethod] = useState<'qr' | 'password'>('qr');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 2. Original QR / Bypass Logic
    const handleLoginSuccess = async () => {
        try {
            const result = await authService.login();
            if (result.success) {
                if (result.isSetupComplete) {
                    navigate('/dashboard');
                } else {
                    navigate('/setup');
                }
            }
        } catch (err) {
            console.error("Login failed", err);
            alert("Login failed. Check console and backend connection.");
        }
    };

    // 3. New Real Password Login Logic
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await authService.login(email, password);
            if (result.success) {
                if (result.isSetupComplete) {
                    navigate('/dashboard');
                } else {
                    navigate('/setup');
                }
            } else {
                alert("Invalid credentials. Please try again.");
            }
        } catch (err) {
            console.error("Login failed", err);
            alert("Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0B1320] flex flex-col font-sans">
            {/* Deep Navy Header Band */}
            <header className="bg-[#050B14] w-full py-6 px-8 flex items-center shadow-md z-10">
                <div className="flex items-center space-x-3 text-white">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-cyan-400" aria-hidden="true">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.47 4.34-2.85 8.13-7 9.5V12H5V6.3l7-3.11v8.8z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold tracking-tight">SecureVerify</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-5xl rounded-2xl shadow-2xl flex overflow-hidden min-h-[580px] border border-gray-800">

                    {/* Left Column: Instructions (#1C2431) */}
                    <div className="w-1/2 p-12 bg-[#1C2431] border-r border-gray-800 transition-all duration-300">
                        {/* You can optionally change the instructions based on the loginMethod state here later */}
                        <LoginInstructions />
                    </div>

                    {/* Right Column: Dynamic Form/QR Area (#131B27) */}
                    <div className="w-1/2 p-12 bg-[#131B27] flex flex-col items-center justify-center relative">

                        {/* --- UI Toggle Switch --- */}
                        <div className="absolute top-8 flex bg-[#0B1320] p-1 rounded-lg border border-gray-800 w-64 shadow-inner">
                            <button
                                onClick={() => setLoginMethod('qr')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${loginMethod === 'qr'
                                    ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                QR Scan
                            </button>
                            <button
                                onClick={() => setLoginMethod('password')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${loginMethod === 'password'
                                    ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Staff Login
                            </button>
                        </div>

                        {/* --- Conditional Rendering --- */}
                        <div className="w-full max-w-sm mt-12 flex flex-col items-center justify-center">
                            {loginMethod === 'qr' ? (
                                // 🟢 QR SCANNER VIEW
                                <div className="animate-fadeIn flex flex-col items-center w-full">
                                    <h2 className="text-xl font-bold text-white mb-2">Holder Authentication</h2>
                                    <p className="text-gray-400 text-sm mb-8 text-center">Scan with your SecureVerify Mobile App</p>
                                    <QRScannerBox
                                        qrImageUrl="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=example-session-123"
                                        sessionTimeout="01:54"
                                        onScanSuccess={handleLoginSuccess}
                                    />
                                </div>
                            ) : (
                                // 🔵 PASSWORD FORM VIEW
                                <div className="animate-fadeIn w-full">
                                    <h2 className="text-xl font-bold text-white mb-2 text-center">Root Admin Access</h2>
                                    <p className="text-gray-400 text-sm mb-8 text-center">Enter your institutional credentials</p>

                                    <form onSubmit={handlePasswordLogin} className="flex flex-col space-y-5">
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold tracking-wider mb-2 uppercase">Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-[#0B1320] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-gray-600"
                                                placeholder="admin@secureverify.com"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold tracking-wider mb-2 uppercase">Password</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-[#0B1320] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-gray-600"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 mt-2 shadow-lg shadow-cyan-900/50 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Signing in...' : 'Secure Login →'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Info */}
            <footer className="py-6 text-center text-gray-500 text-xs flex flex-col items-center">
                <div className="flex justify-center mb-4">
                    <span className="flex items-center px-4 py-2 rounded-full border border-gray-700 bg-[#0B1320]">
                        <svg className="w-3 h-3 mr-2 fill-cyan-400" viewBox="0 0 20 20"><path d="M4 8V6a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm5 6.73V17h2v-2.27a2 2 0 1 0-2 0zM7 6v2h6V6a3 3 0 0 0-6 0z" /></svg>
                        ENTERPRISE GRADE END-TO-END ENCRYPTION
                    </span>
                </div>
                <p className="tracking-widest opacity-50">© 2026 SECUREVERIFY SYSTEMS • VERSION 4.2.1-STABLE</p>

                {/* DEV ONLY BYPASS */}
                <button
                    onClick={handleLoginSuccess}
                    className="mt-4 text-xs font-mono text-cyan-900 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                >
                    [DEV_MODE]: BYPASS AUTHENTICATION &rarr;
                </button>
            </footer>
        </div>
    );
};

export default LoginPage;