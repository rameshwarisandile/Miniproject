import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Rocket } from "lucide-react";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import heroBackground from "@/assets/hero-dark.jpg";

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
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left Panel - Purple with organic shapes */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-8">
        <img
          src={heroBackground}
          alt="Serenity background"
          className="absolute inset-0 w-full h-full object-cover scale-105 contrast-110 brightness-110 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/55 via-purple-500/50 to-purple-700/60" />

        {/* Organic flowing shapes */}
        <svg className="absolute top-0 right-0 w-96 h-96 text-pink-300 opacity-20" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M50,50 Q80,30 120,50 Q140,70 130,110 Q100,140 60,130 Q20,110 50,50" fill="currentColor" />
        </svg>
        
        <svg className="absolute bottom-0 left-0 w-80 h-80 text-purple-300 opacity-15" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,100 Q40,70 80,80 Q120,90 130,130 Q100,160 50,150 Q10,140 10,100" fill="currentColor" />
        </svg>

        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute top-32 left-10 w-3 h-3 bg-white rounded-full"></div>
          <div className="absolute bottom-32 right-32 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-3 h-3 bg-white rounded-full"></div>
        </div>

        {/* Rocket illustration */}
        <div className="relative z-10 text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-300 to-purple-500 rounded-full p-2 flex items-center justify-center shadow-2xl">
                <Rocket className="w-20 h-20 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-pink-400 rounded-full opacity-80"></div>
              <div className="absolute top-0 -left-3 w-8 h-8 bg-red-400 rounded-full opacity-70"></div>
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Serenity</h1>
            <p className="text-pink-100 text-lg">Welcome to wellness</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">USER LOGIN</h2>
            <p className="text-gray-500 text-sm">Welcome to the website</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 pr-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-1 text-pink-500 hover:text-purple-700 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-pink-500" />
                <span>Remember</span>
              </label>
              <Link to="/forgot-password" className="text-pink-600 hover:text-purple-700 font-medium">
                Forgot password ?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-700 hover:from-pink-600 hover:to-purple-800 text-white rounded-full font-semibold text-base transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "Signing in..." : "LOGIN"}
            </Button>
          </form>

          {/* Sign Up */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-pink-600 hover:text-purple-700 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
         
           {/* Back to Home */}
           <div className="mt-4 text-center">
             <Link to="/" className="text-sm text-gray-500 hover:text-pink-600 transition-colors font-medium">
               {"<- Back to Home"}
             </Link>
           </div>
        </div>
      </div>

      {/* Wavy SVG divider - visible on larger screens */}
      <svg className="hidden lg:block absolute right-1/2 top-0 h-full w-24 text-white" viewBox="0 0 100 1200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0,0 Q 25,300 50,600 T 100,1200 L 100,1200 L 0,1200 Z" fill="currentColor" />
      </svg>
    </div>
  );
};

export default Login;
