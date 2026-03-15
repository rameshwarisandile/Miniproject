import { useState } from "react";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Helper: SHA-256 hash
  const hashPassword = (pwd) => {
    return CryptoJS.SHA256(pwd).toString();
  };

  // Helper: AES encrypt/decrypt
  const AES_SECRET = "moodnest_secret_key"; // Should be env in real app
  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), AES_SECRET).toString();
  };
  const decryptData = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, AES_SECRET);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch {
      return null;
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    // LocalStorage logic
    const encrypted = localStorage.getItem("secureUser");
    let localUser = null;
    if (encrypted) {
      localUser = decryptData(encrypted);
      if (!localUser || localUser.email !== email) {
        localUser = null;
      } else {
        const hashed = hashPassword(password);
        if (localUser.password !== hashed) {
          setError("Incorrect password.");
          return;
        }
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedInUserName", localUser.name || "");
        localStorage.setItem("loggedInUserImage", localUser.profileImage || "");
      }
    }
    // --- Backend login ---
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("backendUser", JSON.stringify(data.user));
        // Optionally: set isLoggedIn, name, image from backend
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedInUserName", data.user.name || "");
        localStorage.setItem("loggedInUserImage", data.user.profileImage || "");
        navigate("/dashboard");
        return;
      } else if (!localUser) {
        setError(data.message || "Login failed");
        return;
      }
      // If localUser exists, allow login (already set above)
      navigate("/dashboard");
    } catch (err) {
      if (!localUser) setError("Login failed (backend error)");
      else navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-serenity animate-fade-in bg-card border-border/50">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-bold bg-serenity-gradient bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to continue your wellness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm mb-2">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border text-foreground transition-all duration-300 focus:shadow-serenity focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-card-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-12 bg-input border-border text-foreground transition-all duration-300 focus:shadow-serenity focus:border-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-serenity-gradient hover:opacity-90 text-white border-0 transition-all duration-300 hover:shadow-serenity hover:scale-105"
            >
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up here
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;