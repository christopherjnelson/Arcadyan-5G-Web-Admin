import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { TextInput } from "../components/ui/TextInput";
import { useAuth } from "../hooks/useAuth";
import { classifyApiError } from "../lib/api";

type LoginError = "password" | "gateway" | null;

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginError>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(password);
      navigate("/", { replace: true });
    } catch (err) {
      const kind = classifyApiError(err);
      setError(kind === "auth" ? "password" : "gateway");
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {error === "password" && (
        <Alert title="Invalid Password" onDismiss={() => setError(null)}>
          Please re-enter your password and try again. If you have not changed
          your Gateway&apos;s password, you can find it on the bottom of the
          device.
        </Alert>
      )}
      {error === "gateway" && (
        <Alert
          title="Unable to connect to Gateway"
          onDismiss={() => setError(null)}
        >
          If you have just re-booted the gateway or changed your wireless
          settings, please allow for up to 90 seconds before trying to log back
          in.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold">Log In</h1>
        <TextInput
          id="username"
          label="Username"
          placeholder="admin"
          disabled
          readOnly
        />
        <TextInput
          id="password"
          label="Password"
          type="password"
          placeholder="Password"
          required
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" loading={isLoading}>
          {isLoading ? "Loading..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
