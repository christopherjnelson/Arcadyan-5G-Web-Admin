import { useCallback, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DeviceCard } from "../components/DeviceCard";
import { Spinner } from "../components/ui/Spinner";
import { TextInput } from "../components/ui/TextInput";
import { useAuth } from "../hooks/useAuth";
import { usePolling } from "../hooks/usePolling";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { getClients, rebootGateway, resetAdminPassword } from "../lib/api";
import type { ClientInterface, ClientsResponse } from "../lib/types";

const INTERFACE_LABELS: Record<ClientInterface, string> = {
  "2.4ghz": "2.4GHz",
  "5.0ghz": "5GHz",
  ethernet: "Ethernet",
};

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      onClick={onToggle}
      className="hover:text-amber-400"
    >
      {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}

export function SystemPage() {
  const user = useRequireAuth();
  const { user: authUser, login, logout } = useAuth();
  const [clients, setClients] = useState<ClientsResponse | null>(null);
  const [showDevices, setShowDevices] = useState(false);
  // Sequence guard so a slower, older poll response can never overwrite
  // newer data.
  const requestSeq = useRef(0);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  usePolling(
    useCallback(async () => {
      const seq = ++requestSeq.current;
      try {
        const response = await getClients();
        if (seq === requestSeq.current) setClients(response);
      } catch {
        // Transient poll failures keep the last good data on screen.
      }
    }, []),
    5000,
    user !== null,
  );

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage(null);
    if (currentPassword !== authUser?.password) {
      setPasswordMessage({ kind: "error", text: "Current password is wrong." });
      return;
    }
    setIsSaving(true);
    try {
      await resetAdminPassword(newPassword);
      // The stored credential is now stale; refresh it immediately so
      // transparent re-authentication and the current-password check above
      // keep working with the new password.
      try {
        await login(newPassword);
      } catch {
        // The password changed but re-authentication failed. Never keep a
        // stale credential in memory — force a fresh login instead.
        logout();
        return;
      }
      setPasswordMessage({
        kind: "success",
        text: "Password updated. Use the new password next time you log in.",
      });
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPasswordMessage({
        kind: "error",
        text: "Failed to update password. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReboot() {
    setIsRebooting(true);
    try {
      await rebootGateway();
    } catch {
      // The gateway drops connections while rebooting; errors are expected.
    } finally {
      setIsRebooting(false);
    }
  }

  const clientEntries = clients
    ? (Object.entries(clients.clients) as [
        ClientInterface,
        (typeof clients.clients)[ClientInterface],
      ][])
    : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Settings">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <TextInput
              id="current-password"
              label="Current Password"
              type={showCurrent ? "text" : "password"}
              placeholder="Current Password"
              required
              maxLength={40}
              value={currentPassword}
              invalid={
                currentPassword.length > 0 &&
                currentPassword !== authUser?.password
              }
              onChange={(e) => setCurrentPassword(e.target.value)}
              trailing={
                <PasswordVisibilityToggle
                  visible={showCurrent}
                  onToggle={() => setShowCurrent((v) => !v)}
                />
              }
            />
            <TextInput
              id="new-password"
              label="New Password"
              type={showNew ? "text" : "password"}
              placeholder="New Password"
              required
              minLength={8}
              maxLength={40}
              value={newPassword}
              invalid={newPassword.length > 0 && newPassword.length < 8}
              onChange={(e) => setNewPassword(e.target.value)}
              trailing={
                <PasswordVisibilityToggle
                  visible={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                />
              }
            />
            {passwordMessage && (
              <p
                role="status"
                className={
                  passwordMessage.kind === "error"
                    ? "text-sm text-rose-400"
                    : "text-sm text-emerald-400"
                }
              >
                {passwordMessage.text}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="success"
                loading={isSaving}
                disabled={newPassword.length < 8}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={isRebooting}
                onClick={handleReboot}
              >
                Reboot Gateway
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Network Devices">
          {!clients ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <>
              <dl>
                {clientEntries.map(([iface, devices]) => (
                  <div
                    key={iface}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-1 text-sm"
                  >
                    <dt className="font-semibold text-slate-300">
                      {INTERFACE_LABELS[iface]}
                    </dt>
                    <dd>{devices.length}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <Button
                  variant={showDevices ? "danger" : "primary"}
                  onClick={() => setShowDevices((v) => !v)}
                >
                  {showDevices ? "Hide Devices" : "Show Devices"}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {showDevices && clients && (
        <div className="space-y-4">
          {clientEntries.map(([iface, devices]) =>
            devices.length > 0 ? (
              <div key={iface}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {INTERFACE_LABELS[iface]}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {devices.map((device) => (
                    <DeviceCard
                      key={device.mac}
                      interfaceName={INTERFACE_LABELS[iface]}
                      device={device}
                    />
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
