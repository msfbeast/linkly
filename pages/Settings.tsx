import React, { useState } from 'react';
import { User, Bell, Shield, Key, Trash2, LogOut, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Settings Page - User account and app preferences
 */
const Settings: React.FC = () => {
  const { user, signOut, updateProfile, updatePassword, regenerateApiKey } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Account state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);

  // Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Update local state when user loads
  React.useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile({ displayName });
      if (result.success) {
        // Ideally show a toast here
        console.log('Profile updated');
      }
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    setIsLoading(true);
    setPasswordMessage(null);
    try {
      const result = await updatePassword(newPassword);
      if (result.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
        setNewPassword('');
        setIsChangingPassword(false);
      } else {
        setPasswordMessage({ type: 'error', text: result.error || 'Failed to update password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (window.confirm('Are you sure? This will invalidate your old key.')) {
      setIsLoading(true);
      try {
        await regenerateApiKey();
      } catch (error) {
        console.error('Failed to regenerate key', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Use real API key or fallback
  const apiKey = user?.apiKey || 'No API Key Generated';

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
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
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

                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isLoading || displayName === user?.displayName}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${isLoading || displayName === user?.displayName
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
                      }`}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
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
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 font-medium">Password</p>
                          <p className="text-stone-500 text-sm">Update your password securely</p>
                        </div>
                        {!isChangingPassword && (
                          <button
                            onClick={() => setIsChangingPassword(true)}
                            className="px-4 py-2 bg-white hover:bg-stone-100 text-slate-900 border border-stone-200 rounded-lg text-sm transition-colors"
                          >
                            Change Password
                          </button>
                        )}
                      </div>

                      {isChangingPassword && (
                        <div className="mt-2 p-4 bg-stone-50 rounded-lg border border-stone-200">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full mb-3 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleChangePassword}
                              disabled={isLoading || !newPassword}
                              className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50"
                            >
                              {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                              onClick={() => {
                                setIsChangingPassword(false);
                                setNewPassword('');
                                setPasswordMessage(null);
                              }}
                              className="px-3 py-1.5 bg-white border border-stone-300 text-slate-700 text-sm rounded-lg hover:bg-stone-50"
                            >
                              Cancel
                            </button>
                          </div>
                          {passwordMessage && (
                            <p className={`text-sm mt-2 ${passwordMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {passwordMessage.text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl opacity-70">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-900 font-medium">Two-Factor Authentication</p>
                        <p className="text-stone-500 text-sm">Add an extra layer of security</p>
                      </div>
                      <button disabled className="px-4 py-2 bg-stone-200 text-stone-500 font-semibold rounded-lg text-sm cursor-not-allowed">
                        Coming Soon
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
                    {user?.apiKey ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full border border-emerald-200">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded-full border border-stone-300">Not Generated</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-stone-200 rounded-lg px-4 py-3 text-emerald-600 font-mono text-sm overflow-hidden text-ellipsis">
                      {user?.apiKey ? (showApiKey ? apiKey : '•'.repeat(32)) : 'No API Key Generated'}
                    </code>
                    {user?.apiKey && (
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-3 bg-white hover:bg-stone-50 text-stone-500 border border-stone-200 rounded-lg transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    )}
                    {user?.apiKey && (
                      <button
                        onClick={handleCopyApiKey}
                        className="p-3 bg-white hover:bg-stone-50 text-stone-500 border border-stone-200 rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                  <p className="text-stone-500 text-xs mt-2">Keep this key secret. Do not share it in client-side code.</p>
                </div>

                <button
                  onClick={handleRegenerateKey}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white hover:bg-stone-50 text-slate-900 border border-stone-200 rounded-lg text-sm transition-colors"
                >
                  {user?.apiKey ? 'Regenerate Key' : 'Generate New Key'}
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
