import React from 'react';

const LoginInstructions: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-10 leading-tight">
                Use SecureVerify Admin on your computer
            </h1>

            <ol className="space-y-8 mb-auto">
                <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#0F5C6A] text-cyan-400 rounded-full flex items-center justify-center text-sm font-bold mt-1">
                        1
                    </span>
                    <p className="ml-4 text-gray-300 text-lg">
                        Open the <span className="font-bold text-white">Staff Verifier App</span> on your mobile device.
                    </p>
                </li>
                <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#0F5C6A] text-cyan-400 rounded-full flex items-center justify-center text-sm font-bold mt-1">
                        2
                    </span>
                    <p className="ml-4 text-gray-300 text-lg">
                        Tap the <span className="font-bold text-white">Scan</span> icon located in your app menu.
                    </p>
                </li>
                <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#0F5C6A] text-cyan-400 rounded-full flex items-center justify-center text-sm font-bold mt-1">
                        3
                    </span>
                    <p className="ml-4 text-gray-300 text-lg">
                        Point your phone camera at this screen to capture the code.
                    </p>
                </li>
            </ol>

            <div className="mt-12">
                <a
                    href="#"
                    className="text-cyan-400 hover:text-cyan-300 font-medium text-sm flex items-center transition-colors"
                >
                    First time setup / Trouble logging in?
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
            </div>
        </div>
    );
};

export default LoginInstructions;