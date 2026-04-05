import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import heroBackground from "@/assets/hero-dark.jpg";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => String(params.get("token") || "").trim(), [params]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token missing. Please use the reset link again.");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await parseJsonResponse(response, "Unable to reset password.");
      if (!response.ok) {
        throw new Error(data?.message || "Unable to reset password.");
      }

      setMessage(data?.message || "Password updated successfully.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      setError(err?.message || "Unable to reset password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-8">
        <img
          src={heroBackground}
          alt="Serenity background"
          className="absolute inset-0 w-full h-full object-cover scale-105 contrast-110 brightness-110 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/55 via-purple-500/50 to-purple-700/60" />

        <div className="relative z-10 text-center text-white max-w-xs space-y-3">
          <h1 className="text-4xl font-bold">Serenity</h1>
          <p className="text-pink-100">Set a new secure password</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">RESET PASSWORD</h2>
            <p className="text-gray-500 text-sm mt-1">Create your new password</p>
          </div>

          {!token && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              Reset token missing or invalid.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                {message}
              </div>
            )}

            <Input
              id="new-password"
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
              autoComplete="new-password"
              required
            />

            <Input
              id="confirm-new-password"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-12 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              disabled={loading || !token}
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-700 hover:from-pink-600 hover:to-purple-800 text-white rounded-full font-semibold text-base transition-all duration-300 disabled:opacity-70"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link to="/login" className="text-pink-600 hover:text-purple-700 font-semibold">
              Back to Login
            </Link>
          </div>
          <div className="text-center text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-600 font-medium">
              {"<- Back to Home"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
