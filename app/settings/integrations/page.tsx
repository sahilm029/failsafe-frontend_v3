"use client";

import { useState } from "react";
import { AlertCircle, Link as LinkIcon, Slack, Github, Mail } from "lucide-react";

export default function IntegrationsSettingsPage() {
  const [slackToken, setSlackToken] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [emailConfig, setEmailConfig] = useState("");

  const handleSaveSlack = () => {
    // TODO: Backend gap — endpoint POST /settings/slack not yet implemented
    console.warn("Backend gap: POST /settings/slack not yet implemented");
    alert("Backend functionality for saving integrations is pending.");
  };

  const handleSaveGithub = () => {
    // TODO: Backend gap — endpoint POST /settings/github not yet implemented
    console.warn("Backend gap: POST /settings/github not yet implemented");
    alert("Backend functionality for saving integrations is pending.");
  };

  const handleSaveEmail = () => {
    // TODO: Backend gap — endpoint POST /settings/email not yet implemented
    console.warn("Backend gap: POST /settings/email not yet implemented");
    alert("Backend functionality for saving integrations is pending.");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <LinkIcon className="w-6 h-6 text-primary" />
          Integrations
        </h1>
        <p className="text-text-secondary mt-1">Connect FailSafe to your existing tools and workflows.</p>
      </div>

      <div className="bg-warning/10 border border-warning p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <h3 className="text-warning font-medium">Integrations API Pending</h3>
          <p className="text-warning/80 text-sm mt-1">These settings are frontend-only until the backend endpoints (POST /settings/*) are developed.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Slack Integration */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#4A154B]/10 rounded-md border border-[#4A154B]/20">
                <Slack className="w-6 h-6 text-[#4A154B]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Slack</h2>
                <p className="text-text-secondary text-sm">Send test failure notifications to channels.</p>
              </div>
            </div>
            <span className="text-xs bg-surface border border-border text-text-muted px-2 py-1 rounded-full flex items-center gap-1">
              Not Connected
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="slack-webhook" className="block text-sm font-medium text-text-secondary mb-1">Webhook URL</label>
              <input
                id="slack-webhook"
                type="text"
                placeholder="https://hooks.slack.com/services/..."
                value={slackToken}
                onChange={(e) => setSlackToken(e.target.value)}
                className="w-full px-3 py-2 bg-surface text-text-primary border border-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSaveSlack}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm font-medium cursor-pointer"
              >
                Save Connection
              </button>
            </div>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-text-primary/10 rounded-md border border-text-primary/20">
                <Github className="w-6 h-6 text-text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">GitHub</h2>
                <p className="text-text-secondary text-sm">Automatically create issues for test failures.</p>
              </div>
            </div>
            <span className="text-xs bg-surface border border-border text-text-muted px-2 py-1 rounded-full flex items-center gap-1">
              Not Connected
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="github-token" className="block text-sm font-medium text-text-secondary mb-1">Personal Access Token (Classic or Fine-grained)</label>
              <input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full px-3 py-2 bg-surface text-text-primary border border-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSaveGithub}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm font-medium cursor-pointer"
              >
                Save Connection
              </button>
            </div>
          </div>
        </div>

        {/* Email/SMTP Integration */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Email / SMTP</h2>
                <p className="text-text-secondary text-sm">Send daily or weekly summary reports via email.</p>
              </div>
            </div>
            <span className="text-xs bg-surface border border-border text-text-muted px-2 py-1 rounded-full flex items-center gap-1">
              Not Connected
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="email-config" className="block text-sm font-medium text-text-secondary mb-1">SMTP Connection String</label>
              <input
                id="email-config"
                type="text"
                placeholder="smtp://user:pass@host:port"
                value={emailConfig}
                onChange={(e) => setEmailConfig(e.target.value)}
                className="w-full px-3 py-2 bg-surface text-text-primary border border-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSaveEmail}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm font-medium cursor-pointer"
              >
                Save Connection
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
