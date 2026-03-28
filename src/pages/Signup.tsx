import { useState } from "react";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, Heart } from "lucide-react";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: ""
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
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
  const handleSignup = async (e) => {
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
    // Prevent duplicate email in localStorage
    const existing = localStorage.getItem("secureUser");
    if (existing) {
      const user = decryptData(existing);
      if (user && user.email === email) {
        setError("Email already registered. Please login.");
        return;
      }
    }
    // Hash password, encrypt, store in localStorage
    const hashed = hashPassword(password);
    const userData = { name, email, password: hashed, profileImage };
    const encrypted = encryptData(userData);
    localStorage.setItem("secureUser", encrypted);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loggedInUserName", name);
    localStorage.setItem("loggedInUserImage", profileImage || "");

    // --- Backend API call ---
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("email", email);
      form.append("password", password); // send plain password, backend hashes
      form.append("confirmPassword", confirmPassword);
      if (profileImageFile) {
        form.append("profileImage", profileImageFile);
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }
      // Optionally: show success or redirect
      navigate("/login");
    } catch (err) {
      setError("Signup failed (backend error)");
    }
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
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormData("profileImage", reader.result.toString());
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft flex items-center justify-center px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-serenity-gradient opacity-5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-serenity-gradient opacity-5 rounded-full blur-3xl -z-10"></div>
      
      <Card className="w-full max-w-md card-elevated animate-fade-in">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="inline-flex justify-center mb-4">
            <div className="w-16 h-16 bg-serenity-gradient rounded-2xl flex items-center justify-center shadow-serenity-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-gradient-primary">
            Join Serenity
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Start your mental wellness journey today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive/90 text-sm font-medium animate-shake">
                {error}
              </div>
            )}
            <div className="space-y-2.5">
              <Label htmlFor="name" className="label-enhanced">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                required
                className="input-focus-glow bg-background border-2 border-serenity-calm/30 rounded-lg px-4 py-2.5 text-foreground transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="email" className="label-enhanced">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                required
                className="input-focus-glow bg-background border-2 border-serenity-calm/30 rounded-lg px-4 py-2.5 text-foreground transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="password" className="label-enhanced">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
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
            
            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword" className="label-enhanced">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  required
                  className="input-focus-glow bg-background border-2 border-serenity-calm/30 rounded-lg px-4 py-2.5 text-foreground transition-all duration-300"
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary font-bold" />
                )}
              </div>
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="profileImage" className="label-enhanced">Profile Picture (Optional)</Label>
              <div className="relative">
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="input-focus-glow bg-background border-2 border-serenity-calm/30 rounded-lg px-4 py-2.5 text-foreground transition-all duration-300 cursor-pointer"
                />
              </div>
              {formData.profileImage && (
                <div className="mt-3 flex justify-center">
                  <img src={formData.profileImage} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/50 shadow-serenity-md" />
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full btn-primary-enhanced py-2.5 rounded-lg text-base font-semibold mt-6"
            >
              Create Account
            </Button>
          </form>
          
          <div className="mt-8 space-y-4">
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <span className="text-primary hover:underline cursor-pointer font-medium">Terms of Service</span> and{" "}
              <span className="text-primary hover:underline cursor-pointer font-medium">Privacy Policy</span>
            </p>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-serenity-calm/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Already have an account?</span>
              </div>
            </div>
            
            <Link to="/login" className="block">
              <Button 
                type="button"
                variant="outline"
                className="w-full py-2.5 rounded-lg border-2 border-serenity-calm/50 hover:border-primary hover:bg-primary/10 transition-all duration-300 font-semibold"
              >
                Sign In Instead
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

export default Signup;