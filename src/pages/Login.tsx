import { useState } from "react";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft flex items-center justify-center px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-serenity-gradient opacity-5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-serenity-gradient opacity-5 rounded-full blur-3xl -z-10"></div>
      
      <Card className="w-full max-w-md card-elevated animate-fade-in">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="inline-flex justify-center mb-4">
            <div className="w-16 h-16 bg-serenity-gradient rounded-2xl flex items-center justify-center shadow-serenity-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-gradient-primary">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Sign in to continue your wellness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive/90 text-sm font-medium animate-shake">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="email" className="label-enhanced">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-focus-glow bg-background border-2 border-serenity-calm/30 rounded-lg px-4 py-2.5 text-foreground transition-all duration-300"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="label-enhanced">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-focus-glow bg-background border-2 border-serenity-calm/30 rounded-lg px-4 py-2.5 pr-12 text-foreground transition-all duration-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-primary-enhanced py-2.5 rounded-lg text-base font-semibold mt-6"
            >
              Sign In
            </Button>
          </form>
          
          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-serenity-calm/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">New to Serenity?</span>
              </div>
            </div>
            
            <Link to="/signup" className="block">
              <Button 
                type="button"
                variant="outline"
                className="w-full py-2.5 rounded-lg border-2 border-serenity-calm/50 hover:border-primary hover:bg-primary/10 transition-all duration-300 font-semibold"
              >
                Create Account
              </Button>
            </Link>
            
            <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;