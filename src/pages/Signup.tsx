import { useState } from "react";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: ""
  });
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

  // Signup handler
  const handleSignup = (e) => {
    e.preventDefault();
    setError("");
    const { name, email, password, confirmPassword, profileImage } = formData;
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    // Prevent duplicate email
    const existing = localStorage.getItem("secureUser");
    if (existing) {
      const user = decryptData(existing);
      if (user && user.email === email) {
        setError("Email already registered. Please login.");
        return;
      }
    }
    // Hash password, encrypt, store
    const hashed = hashPassword(password);
    const userData = { name, email, password: hashed, profileImage };
    const encrypted = encryptData(userData);
    localStorage.setItem("secureUser", encrypted);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loggedInUserName", name);
    localStorage.setItem("loggedInUserImage", profileImage || "");
    navigate("/dashboard");
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      setError("Only JPG, JPEG, PNG files allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormData("profileImage", reader.result.toString());
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-serenity animate-fade-in bg-card border-border/50">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-bold bg-serenity-gradient bg-clip-text text-transparent">
            Join Serenity
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create your account to start your mental wellness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm mb-2">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-card-foreground">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                required
                className="bg-input border-border text-foreground transition-all duration-300 focus:shadow-serenity focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
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
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-card-foreground">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  required
                  className="bg-input border-border text-foreground transition-all duration-300 focus:shadow-serenity focus:border-primary"
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profileImage" className="text-card-foreground">Profile Image (optional)</Label>
              <Input
                id="profileImage"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
                className="bg-input border-border text-foreground"
              />
              {formData.profileImage && (
                <img src={formData.profileImage} alt="Preview" className="w-16 h-16 rounded-full object-cover mt-2 mx-auto border" />
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-serenity-gradient hover:opacity-90 text-white border-0 transition-all duration-300 hover:shadow-serenity hover:scale-105"
            >
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-4">
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in here
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

export default Signup;