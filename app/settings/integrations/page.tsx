"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { saveSlackSettings, testSlackNotification, saveEmailSettings, testEmailNotification } from "@/lib/api";
import { toast } from "sonner";
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";

export default function IntegrationsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Integrations</h1>
      <SlackIntegrationCard />
      <EmailIntegrationCard />
    </div>
  );
}

function SlackIntegrationCard() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channel, setChannel] = useState("");
  const [events, setEvents] = useState({
    testStarted: true,
    testFailed: true,
    testCompleted: false,
    faultInjected: false,
  });
  const [isConnected, setIsConnected] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => saveSlackSettings({ webhookUrl, channel, events }),
    onSuccess: () => {
      setIsConnected(true);
      toast.success("Slack settings saved");
    },
    onError: () => toast.error("Failed to save Slack settings"),
  });

  const testMutation = useMutation({
    mutationFn: testSlackNotification,
    onSuccess: () => toast.success("Test notification sent"),
    onError: () => toast.error("Failed to send test notification"),
  });

  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Slack Integration</h2>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-success" : "bg-text-muted"}`} />
            <span className="text-xs text-text-muted">
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Webhook URL</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Channel</label>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="#chaos-alerts"
            className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-3">Events</label>
          <div className="space-y-2">
            {[
              { key: "testStarted", label: "Test Started" },
              { key: "testFailed", label: "Test Failed" },
              { key: "testCompleted", label: "Test Completed" },
              { key: "faultInjected", label: "Fault Injected" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={events[key as keyof typeof events]}
                  onChange={(e) => setEvents({ ...events, [key]: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => testMutation.mutate()}
            disabled={!webhookUrl || testMutation.isPending}
            className="w-full sm:w-auto px-4 py-2 bg-surface hover:bg-surface/80 text-text-primary rounded border border-border transition-colors disabled:opacity-50"
          >
            {testMutation.isPending ? "Sending..." : "Test Notification"}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!webhookUrl || saveMutation.isPending}
            className="w-full sm:w-auto px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailIntegrationCard() {
  const [provider, setProvider] = useState<"smtp" | "sendgrid" | "resend">("smtp");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [events, setEvents] = useState({
    testStarted: false,
    testFailed: true,
    testCompleted: false,
    faultInjected: false,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveEmailSettings({
        provider,
        smtp: provider === "smtp" ? {
          host: smtpHost,
          port: parseInt(smtpPort),
          user: smtpUser,
          password: smtpPassword,
        } : undefined,
        apiKey: provider !== "smtp" ? apiKey : undefined,
        recipients,
        events,
      }),
    onSuccess: () => toast.success("Email settings saved"),
    onError: () => toast.error("Failed to save email settings"),
  });

  const testMutation = useMutation({
    mutationFn: testEmailNotification,
    onSuccess: () => toast.success("Test email sent"),
    onError: () => toast.error("Failed to send test email"),
  });

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Email Integration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Provider</label>
          <div className="flex gap-2">
            {(["smtp", "sendgrid", "resend"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  provider === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-text-secondary hover:text-text-primary"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {provider === "smtp" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.example.com"
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Port</label>
              <input
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Username</label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`${provider === "sendgrid" ? "SG." : "re_"}...`}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Recipients</label>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRecipient()}
              placeholder="email@example.com"
              className="flex-1 px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addRecipient}
              className="p-2 bg-surface hover:bg-surface/80 rounded border border-border"
            >
              <PlusIcon className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipients.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2 py-1 bg-surface rounded text-sm text-text-primary"
              >
                {email}
                <button onClick={() => removeRecipient(email)}>
                  <Cross2Icon className="w-3 h-3 text-text-muted hover:text-danger" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-3">Events</label>
          <div className="space-y-2">
            {[
              { key: "testStarted", label: "Test Started" },
              { key: "testFailed", label: "Test Failed" },
              { key: "testCompleted", label: "Test Completed" },
              { key: "faultInjected", label: "Fault Injected" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={events[key as keyof typeof events]}
                  onChange={(e) => setEvents({ ...events, [key]: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => testMutation.mutate()}
            disabled={recipients.length === 0 || testMutation.isPending}
            className="w-full sm:w-auto px-4 py-2 bg-surface hover:bg-surface/80 text-text-primary rounded border border-border transition-colors disabled:opacity-50"
          >
            {testMutation.isPending ? "Sending..." : "Send Test Email"}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
