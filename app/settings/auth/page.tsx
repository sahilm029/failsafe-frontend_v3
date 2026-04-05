"use client";

import { useState } from "react";
import { AlertCircle, Lock, Shield, Users } from "lucide-react";

export default function AuthSettingsPage() {
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authProvider, setAuthProvider] = useState("local");
  const [ssoDomain, setSsoDomain] = useState("");

  const handleSaveAuth = () => {
    // TODO: Backend gap — missing endpoint POST /settings/auth to save authentication config
    console.warn("Backend gap: POST /settings/auth not yet implemented");
    alert("Authentication settings save is currently unavailable (awaiting backend integration).");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Authentication & Access
        </h1>
        <p className="text-text-secondary mt-1">Manage organization access controls and user security.</p>
      </div>

      <div className="bg-warning/10 border border-warning p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <h3 className="text-warning font-medium">Auth Management Unavailable</h3>
          <p className="text-warning/80 text-sm mt-1">Backend gap: Endpoints for authentication configuration and SSO integration have not been implemented yet. Changes here will not persist.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Global Access Switch */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Require Authentication</h2>
                <p className="text-text-secondary text-sm">Force users to log in to access the FailSafe dashboard.</p>
              </div>
            </div>
            {/* Custom styled toggle switch based on tailwind tokens */}
            <button 
              onClick={() => setAuthEnabled(!authEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${authEnabled ? 'bg-primary' : 'bg-surface border border-border'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-text-primary rounded-full transition-transform ${authEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className={`space-y-4 pt-4 border-t border-border ${!authEnabled && 'opacity-50 pointer-events-none'}`}>
            <div>
              <label htmlFor="auth-provider" className="block text-sm font-medium text-text-secondary mb-1">Authentication Provider</label>
              <select
                id="auth-provider"
                value={authProvider}
                onChange={(e) => setAuthProvider(e.target.value)}
                className="w-full sm:max-w-md px-3 py-2 bg-surface text-text-primary border border-border rounded-md appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                disabled={!authEnabled}
              >
                <option value="local">Local (Username / Password)</option>
                <option value="saml">SAML / SSO</option>
                <option value="oidc">OIDC</option>
              </select>
            </div>

            {authProvider !== "local" && (
              <div>
                <label htmlFor="sso-domain" className="block text-sm font-medium text-text-secondary mb-1">SSO Domain / Provider URL</label>
                <input
                  id="sso-domain"
                  type="text"
                  placeholder="https://login.yourcompany.com"
                  value={ssoDomain}
                  onChange={(e) => setSsoDomain(e.target.value)}
                  className="w-full sm:max-w-md px-3 py-2 bg-surface text-text-primary border border-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={!authEnabled}
                />
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveAuth}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!authEnabled}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Roles overview mockup */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-surface rounded-md border border-border text-text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">User Management Hub</h2>
              <p className="text-text-secondary text-sm">Role-based access control (RBAC) requires backend support.</p>
            </div>
          </div>

          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md">
            <p className="text-text-muted text-sm font-medium">User directory pending GET /users backend implementation</p>
          </div>
        </div>

      </div>
    </div>
  );
}
