import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, Rocket } from "lucide-react";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import heroBackground from "@/assets/hero-dark.jpg";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateFormData = (key: "name" | "email" | "password" | "confirmPassword", value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProfileImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(String(reader.result || ""));
      reader.readAsDataURL(file);
    } else {
      setPreviewImage("");
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const { name, email, password, confirmPassword } = formData;
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("name", name.trim());
      payload.append("email", email.trim());
      payload.append("password", password);
      payload.append("confirmPassword", confirmPassword);
      if (profileImageFile) {
        payload.append("profileImage", profileImageFile);
      }

      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        body: payload,
      });

      const data = await parseJsonResponse(response, "Signup failed");
      if (!response.ok) {
        throw new Error(data?.message || "Unable to create account.");
      }

      navigate("/login");
    } catch (err: any) {
      setError(err?.message || "Unable to create account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left Panel - Purple Organic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-8">
        <img
          src={heroBackground}
          alt="Serenity background"
          className="absolute inset-0 w-full h-full object-cover scale-105 contrast-110 brightness-110 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/55 via-purple-500/50 to-purple-700/60" />

        {/* Organic SVG shapes background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15"
          viewBox="0 0 400 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 150 100 Q 200 50, 250 100 T 300 200 Q 350 300, 250 400 Q 150 500, 100 400 Q 50 300, 100 200 T 150 100"
            fill="white"
            opacity="0.2"
          />
          <path
            d="M 200 150 Q 280 120, 320 180 T 300 320 Q 250 380, 150 340 Q 100 300, 120 200 T 200 150"
            fill="white"
            opacity="0.15"
          />
        </svg>

        {/* Decorative dots */}
        <div className="absolute top-20 left-1/4 w-3 h-3 bg-white rounded-full opacity-20" />
        <div className="absolute top-40 right-1/4 w-2 h-2 bg-white rounded-full opacity-25" />
        <div className="absolute bottom-32 left-1/3 w-2.5 h-2.5 bg-white rounded-full opacity-20" />
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-white rounded-full opacity-30" />

        {/* Content */}
        <div className="relative z-10 text-center space-y-8 max-w-xs">
          {/* Rocket Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-red-400 rounded-full opacity-20" />
              <div className="absolute -top-2 -right-6 w-20 h-20 bg-pink-300 rounded-full opacity-15" />
              <Rocket className="w-20 h-20 text-white mx-auto relative z-10" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">Serenity</h1>
            <p className="text-lg font-light text-white/90">Join the Wellness Movement</p>
          </div>

          {/* Description */}
          <p className="text-sm font-light text-white/80 leading-relaxed">
            Begin your journey to emotional well-being and discover the power of mindfulness combined with
            creative self-expression.
          </p>
        </div>

        {/* Wavy divider on the right */}
        <svg
          className="absolute right-0 top-0 h-full w-24 opacity-20"
          viewBox="0 0 100 600"
          preserveAspectRatio="none"
        >
          <path d="M 0 0 Q 25 75, 0 150 T 0 300 T 0 450 T 0 600" stroke="white" strokeWidth="2" fill="none" />
          <path d="M 20 0 Q 45 75, 20 150 T 20 300 T 20 450 T 20 600" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
        </svg>
      </div>

      {/* Right Panel - White Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 py-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">USER SIGNUP</h2>
            <p className="text-base text-gray-600">Create your wellness account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <Input
                id="name"
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                required
                autoComplete="name"
                className="w-full h-11 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                required
                autoComplete="new-password"
                className="w-full h-11 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 pr-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-1 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                required
                autoComplete="new-password"
                className="w-full h-11 rounded-full border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 pr-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>

            {/* Profile Picture */}
            <div>
              <Input
                id="profileImage"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
                className="w-full h-11 rounded-full border-2 border-dashed border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 text-gray-900 cursor-pointer file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-200 file:text-pink-700 hover:file:bg-purple-200 transition-all text-sm"
              />
            </div>

            {previewImage && (
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-3 border-purple-300"
                  />
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-700 hover:from-pink-600 hover:to-purple-800 text-white rounded-full font-semibold text-base transition-all mt-2 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-pink-600 font-semibold hover:text-purple-700 transition-colors">
              Sign In
            </Link>
          </p>
         
           {/* Back to Home */}
           <div className="text-center mt-3">
             <Link to="/" className="text-sm text-gray-500 hover:text-pink-600 transition-colors font-medium">
               {"<- Back to Home"}
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
