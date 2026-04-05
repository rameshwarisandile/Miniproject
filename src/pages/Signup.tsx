import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, Heart } from "lucide-react";
import { apiUrl, parseJsonResponse } from "@/lib/api";

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
          <CardTitle className="text-3xl sm:text-4xl font-bold text-gradient-primary">Join Serenity</CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            Start your mental wellness journey today
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
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
                autoComplete="name"
                className="input-focus-glow h-11 sm:h-12 bg-background border-2 border-serenity-calm/30 rounded-lg"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email" className="label-enhanced">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                required
                autoComplete="email"
                className="input-focus-glow h-11 sm:h-12 bg-background border-2 border-serenity-calm/30 rounded-lg"
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
                  autoComplete="new-password"
                  className="input-focus-glow h-11 sm:h-12 bg-background border-2 border-serenity-calm/30 rounded-lg pr-12"
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
                  autoComplete="new-password"
                  className="input-focus-glow h-11 sm:h-12 bg-background border-2 border-serenity-calm/30 rounded-lg pr-12"
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="profileImage" className="label-enhanced">Profile Picture (Optional)</Label>
              <Input
                id="profileImage"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
                className="input-focus-glow h-11 bg-background border-2 border-serenity-calm/30 rounded-lg cursor-pointer"
              />
              {previewImage && (
                <div className="mt-3 flex justify-center">
                  <img src={previewImage} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/50 shadow-serenity-md" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-primary-enhanced h-11 sm:h-12 rounded-lg text-base font-semibold mt-6">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our <span className="text-primary font-medium">Terms of Service</span> and <span className="text-primary font-medium">Privacy Policy</span>
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-serenity-calm/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <Link to="/login" className="block">
              <Button type="button" variant="outline" className="w-full h-11 sm:h-12 rounded-lg border-2 border-serenity-calm/50 hover:border-primary hover:bg-primary/10 transition-all duration-300 font-semibold">
                Sign In Instead
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

export default Signup;
