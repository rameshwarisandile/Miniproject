import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart } from "lucide-react";
import { apiUrl, parseJsonResponse } from "@/lib/api";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await parseJsonResponse(response, "Login failed");
      if (!response.ok) {
        throw new Error(data?.message || "Invalid email or password.");
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("jwtToken", data.token || "");
      localStorage.setItem("backendUser", JSON.stringify(data.user || {}));
      localStorage.setItem("loggedInUserName", data.user?.name || "");
      localStorage.setItem("loggedInUserImage", data.user?.profileImage || "");

      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Unable to login right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background to-serenity-soft flex items-center justify-center px-4 py-8">
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-serenity-gradient opacity-10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 bg-serenity-gradient opacity-10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md card-elevated animate-fade-in border border-border/40 bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-6 sm:pb-8">
          <div className="inline-flex justify-center mb-2 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-serenity-gradient rounded-2xl flex items-center justify-center shadow-serenity-lg">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-bold text-gradient-primary">Welcome Back</CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            Sign in to continue your wellness journey
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive/90 text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="label-enhanced">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-focus-glow h-11 sm:h-12 bg-background border-2 border-serenity-calm/30 rounded-lg"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="label-enhanced">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-focus-glow h-11 sm:h-12 bg-background border-2 border-serenity-calm/30 rounded-lg pr-12"
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-primary-enhanced h-11 sm:h-12 rounded-lg text-base font-semibold mt-6">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-serenity-calm/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">New to Serenity?</span>
              </div>
            </div>

            <Link to="/signup" className="block">
              <Button type="button" variant="outline" className="w-full h-11 sm:h-12 rounded-lg border-2 border-serenity-calm/50 hover:border-primary hover:bg-primary/10 transition-all duration-300 font-semibold">
                Create Account
              </Button>
            </Link>

            <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
