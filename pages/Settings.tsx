import React, { useState } from 'react';
import { User, Bell, Shield, Key, Trash2, LogOut, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Settings Page - User account and app preferences
 */
const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock API key
  const apiKey = 'lk_live_' + (user?.id?.slice(0, 24) || 'demo_key_12345678');

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-stone-500 text-sm mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === tab.id
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-slate-900'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-500 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-stone-50 border border-stone-200 text-stone-500 px-4 py-3 rounded-xl opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-stone-500 mb-2">Display Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full bg-white border border-stone-200 text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-stone-500 mb-2">Plan</label>
                    <div className="flex items-center justify-between bg-stone-50 border border-stone-200 px-4 py-3 rounded-xl">
                      <div>
                        <span className="text-slate-900 font-medium">Free Plan</span>
                        <p className="text-stone-500 text-sm">100 links, basic analytics</p>
                      </div>
                      <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold rounded-lg text-sm transition-colors shadow-sm shadow-yellow-400/20">
                        Upgrade
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <h3 className="text-red-500 font-semibold mb-4">Danger Zone</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { label: 'Email notifications', desc: 'Receive updates about your links via email' },
                    { label: 'Click milestones', desc: 'Get notified when links reach click milestones' },
                    { label: 'Weekly reports', desc: 'Receive weekly analytics summaries' },
                    { label: 'Security alerts', desc: 'Get notified about suspicious activity' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="text-slate-900 font-medium">{item.label}</p>
                        <p className="text-stone-500 text-sm">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                        <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-900 font-medium">Password</p>
                        <p className="text-stone-500 text-sm">Last changed 30 days ago</p>
                      </div>
                      <button className="px-4 py-2 bg-white hover:bg-stone-100 text-slate-900 border border-stone-200 rounded-lg text-sm transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-900 font-medium">Two-Factor Authentication</p>
                        <p className="text-stone-500 text-sm">Add an extra layer of security</p>
                      </div>
                      <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold rounded-lg text-sm transition-colors shadow-sm shadow-yellow-400/20">
                        Enable 2FA
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <p className="text-slate-900 font-medium mb-2">Active Sessions</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <div>
                            <p className="text-slate-900 text-sm">Current session</p>
                            <p className="text-stone-500 text-xs">MacOS • Chrome • Now</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out of all devices
                </button>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
                <p className="text-stone-500 text-sm">Use API keys to integrate Gather with your applications.</p>

                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-slate-900 font-medium">Live API Key</p>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full border border-emerald-200">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-stone-200 rounded-lg px-4 py-3 text-emerald-600 font-mono text-sm">
                      {showApiKey ? apiKey : '•'.repeat(32)}
                    </code>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-3 bg-white hover:bg-stone-50 text-stone-500 border border-stone-200 rounded-lg transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleCopyApiKey}
                      className="p-3 bg-white hover:bg-stone-50 text-stone-500 border border-stone-200 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-stone-500 text-xs mt-2">Keep this key secret. Do not share it in client-side code.</p>
                </div>

                <button className="px-4 py-2 bg-white hover:bg-stone-50 text-slate-900 border border-stone-200 rounded-lg text-sm transition-colors">
                  Generate New Key
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
