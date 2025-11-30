import React, { useState } from 'react';
import StorefrontPreview from '../components/StorefrontPreview';
import DomainManager from '../components/DomainManager';
import { User, Bell, Shield, Key, Trash2, LogOut, Check, Copy, Eye, EyeOff, LayoutTemplate, ExternalLink, Globe, CreditCard } from 'lucide-react';
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

  // Storefront state
  const [selectedTheme, setSelectedTheme] = useState(user?.storefrontTheme || 'vibrant');
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Update local state when user loads
  React.useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    if (user?.storefrontTheme) {
      setSelectedTheme(user.storefrontTheme);
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

  const handleSaveTheme = async (theme: string) => {
    setIsSavingTheme(true);
    setSelectedTheme(theme);
    try {
      const result = await updateProfile({ storefrontTheme: theme });
      if (result.success) {
        console.log('Theme updated');
      }
    } catch (error) {
      console.error('Failed to update theme', error);
    } finally {
      setIsSavingTheme(false);
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
    { id: 'storefront', label: 'Storefront', icon: LayoutTemplate },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'monetization', label: 'Monetization', icon: Check }, // Using Check icon for now, ideally DollarSign
  ];

  // Monetization state
  const [flipkartId, setFlipkartId] = useState(user?.flipkartAffiliateId || '');
  const [amazonTag, setAmazonTag] = useState(user?.amazonAssociateTag || '');
  const [isSavingMonetization, setIsSavingMonetization] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState({
    email: true,
    milestones: true,
    reports: true,
    security: true
  });

  React.useEffect(() => {
    if (user?.flipkartAffiliateId) setFlipkartId(user.flipkartAffiliateId);
    if (user?.amazonAssociateTag) setAmazonTag(user.amazonAssociateTag);
    if (user?.settingsNotifications) {
      setNotifications(user.settingsNotifications);
    }
  }, [user]);

  const handleNotificationChange = async (key: keyof typeof notifications) => {
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    try {
      await import('../services/storage/supabaseAdapter').then(m => m.supabaseAdapter.updateNotificationSettings(newSettings));
    } catch (error) {
      console.error('Failed to update notifications', error);
    }
  };

  const handleSaveMonetization = async () => {
    setIsSavingMonetization(true);
    try {
      const result = await updateProfile({
        flipkartAffiliateId: flipkartId,
        amazonAssociateTag: amazonTag
      });
      if (result.success) {
        console.log('Monetization settings updated');
      }
    } catch (error) {
      console.error('Failed to update monetization settings', error);
    } finally {
      setIsSavingMonetization(false);
    }
  };

  const templates = [
    { id: 'vibrant', name: 'Vibrant', description: 'Bold colors and dynamic energy.', color: 'bg-[#FF3366]' },
    { id: 'glass', name: 'Glass (BW)', description: 'Sleek glassmorphism in black & white.', color: 'bg-black' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon lights and glitch effects.', color: 'bg-[#00ff00]' },
    { id: 'retro', name: 'Retro Pop', description: 'Nostalgic 80s/90s vibe.', color: 'bg-[#FFCC00]' },
    { id: 'neubrutalism', name: 'Neubrutalism', description: 'Raw, bold, and high contrast.', color: 'bg-[#FF6B6B]' },
    { id: 'lofi', name: 'Lofi', description: 'Calm, textured, and relaxed.', color: 'bg-[#F7F2E8]' },
    { id: 'clay', name: 'Claymorphism', description: 'Soft, 3D inflated shapes.', color: 'bg-[#f0f4f8]' },
    { id: 'bauhaus', name: 'Bauhaus', description: 'Geometric, artistic, primary colors.', color: 'bg-[#f4f1ea]' },
    { id: 'industrial', name: 'Industrial', description: 'Clean, technical, engineered look.', color: 'bg-[#E2E2E2]' },
    { id: 'lab', name: 'Lab', description: 'Clinical, white industrial, pure.', color: 'bg-white border border-gray-200' },
    { id: 'archive', name: 'Archive', description: 'Database style, structured, curated.', color: 'bg-[#F0F0F0]' },
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

            {/* Storefront Tab */}
            {activeTab === 'storefront' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Storefront Template</h2>
                  <a href="/test-storefront" target="_blank" className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                    Preview All <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-stone-500 text-sm">Choose the design for your public product store.</p>

                <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 flex justify-center">
                  <div className="w-full max-w-2xl shadow-2xl rounded-2xl overflow-hidden border-4 border-slate-900 bg-white">
                    <StorefrontPreview theme={selectedTheme} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSaveTheme(template.id)}
                      disabled={isSavingTheme}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all group ${selectedTheme === template.id
                        ? 'border-yellow-400 bg-yellow-50/50'
                        : 'border-stone-100 hover:border-stone-200 bg-white'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg shadow-sm flex-shrink-0 ${template.color}`}></div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{template.name}</h3>
                          <p className="text-stone-500 text-xs mt-1">{template.description}</p>
                        </div>
                      </div>
                      {selectedTheme === template.id && (
                        <div className="absolute top-4 right-4 text-yellow-500">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Domains Tab */}
            {activeTab === 'domains' && user && (
              <DomainManager userId={user.id} />
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'Email notifications', desc: 'Receive updates about your links via email' },
                    { key: 'milestones', label: 'Click milestones', desc: 'Get notified when links reach click milestones' },
                    { key: 'reports', label: 'Weekly reports', desc: 'Receive weekly analytics summaries' },
                    { key: 'security', label: 'Security alerts', desc: 'Get notified about suspicious activity' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="text-slate-900 font-medium">{item.label}</p>
                        <p className="text-stone-500 text-sm">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={() => handleNotificationChange(item.key as keyof typeof notifications)}
                        />
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
            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Billing & Subscription</h2>
                <p className="text-stone-500 text-sm">Manage your plan and payment details.</p>

                <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-slate-900 font-medium text-lg capitalize">{user?.preferences?.subscription_tier || 'Free'} Plan</p>
                      <p className="text-stone-500 text-sm">
                        {user?.preferences?.subscription_status === 'active'
                          ? 'Your subscription is active.'
                          : 'You are currently on the free plan.'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.preferences?.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-200 text-stone-600'
                      }`}>
                      {user?.preferences?.subscription_status === 'active' ? 'Active' : 'Free'}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {user?.preferences?.subscription_tier === 'free' || !user?.preferences?.subscription_tier ? (
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                      >
                        Upgrade Plan
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/create-portal-session', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                customerId: user?.preferences?.stripe_customer_id,
                                returnUrl: window.location.href
                              }),
                            });
                            const data = await response.json();
                            if (data.url) window.location.href = data.url;
                          } catch (err) {
                            console.error('Failed to open portal:', err);
                            alert('Failed to load billing portal.');
                          }
                        }}
                        className="px-4 py-2 bg-white border border-stone-300 text-slate-700 hover:bg-stone-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Billing & Subscription</h2>
                <p className="text-stone-500 text-sm">Manage your plan and payment details.</p>

                <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-slate-900 font-medium text-lg capitalize">{user?.preferences?.subscription_tier || 'Free'} Plan</p>
                      <p className="text-stone-500 text-sm">
                        {user?.preferences?.subscription_status === 'active'
                          ? 'Your subscription is active.'
                          : 'You are currently on the free plan.'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.preferences?.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-200 text-stone-600'
                      }`}>
                      {user?.preferences?.subscription_status === 'active' ? 'Active' : 'Free'}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {user?.preferences?.subscription_tier === 'free' || !user?.preferences?.subscription_tier ? (
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                      >
                        Upgrade Plan
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/create-portal-session', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                customerId: user?.preferences?.stripe_customer_id,
                                returnUrl: window.location.href
                              }),
                            });
                            const data = await response.json();
                            if (data.url) window.location.href = data.url;
                          } catch (err) {
                            console.error('Failed to open portal:', err);
                            alert('Failed to load billing portal.');
                          }
                        }}
                        className="px-4 py-2 bg-white border border-stone-300 text-slate-700 hover:bg-stone-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Billing & Subscription</h2>
                <p className="text-stone-500 text-sm">Manage your plan and payment details.</p>

                <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-slate-900 font-medium text-lg capitalize">{user?.preferences?.subscription_tier || 'Free'} Plan</p>
                      <p className="text-stone-500 text-sm">
                        {user?.preferences?.subscription_status === 'active'
                          ? 'Your subscription is active.'
                          : 'You are currently on the free plan.'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.preferences?.subscription_status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-stone-200 text-stone-600'
                      }`}>
                      {user?.preferences?.subscription_status === 'active' ? 'Active' : 'Free'}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {user?.preferences?.subscription_tier === 'free' || !user?.preferences?.subscription_tier ? (
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                      >
                        Upgrade Plan
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/create-portal-session', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                customerId: user?.preferences?.stripe_customer_id,
                                returnUrl: window.location.href
                              }),
                            });
                            const data = await response.json();
                            if (data.url) window.location.href = data.url;
                          } catch (err) {
                            console.error('Failed to open portal:', err);
                            alert('Failed to load billing portal.');
                          }
                        }}
                        className="px-4 py-2 bg-white border border-stone-300 text-slate-700 hover:bg-stone-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Monetization Tab */}
            {activeTab === 'monetization' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Monetization</h2>
                <p className="text-stone-500 text-sm">Automatically add your affiliate tags to links you create.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-500 mb-2">Flipkart Affiliate ID</label>
                    <input
                      type="text"
                      value={flipkartId}
                      onChange={(e) => setFlipkartId(e.target.value)}
                      placeholder="e.g. yourname"
                      className="w-full bg-white border border-stone-200 text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-stone-500 mb-2">Amazon Associate Tag</label>
                    <input
                      type="text"
                      value={amazonTag}
                      onChange={(e) => setAmazonTag(e.target.value)}
                      placeholder="e.g. yourname-21"
                      className="w-full bg-white border border-stone-200 text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={handleSaveMonetization}
                    disabled={isSavingMonetization}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${isSavingMonetization
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
                      }`}
                  >
                    {isSavingMonetization ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
