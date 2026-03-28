import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Heart, Brain, Users, Shield } from "lucide-react";
import heroBackground from "@/assets/hero-dark.jpg";
import meditationGlow from "@/assets/meditation-glow.jpg";
import brainAi from "@/assets/brain-ai.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBackground} 
            alt="Cosmic background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-transparent to-serenity-focus/20"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-serenity-gradient bg-clip-text text-transparent animate-slide-up">
            Serenity
          </h1>

          <p className="text-xl md:text-2xl text-foreground/90 mb-8 animate-slide-up delay-100">
            Your A Voice Enabled AI Mental Wellness Companion
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-slide-up delay-200">
            Break the stigma. Track your mood, practice mindfulness, and get personalized support 
            in a space designed for your generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up delay-300">
            <Link to="/signup">
              <Button size="lg" className="bg-serenity-gradient hover:opacity-90 text-primary-foreground px-8 py-4 text-lg shadow-serenity transition-all duration-300 hover:scale-105 border-0">
                Start Your Journey
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-border hover:bg-serenity-calm hover:border-primary transition-all duration-300 hover:scale-105">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">How Serenity Helps You</h2>
            <p className="text-xl text-muted-foreground">Personalized mental wellness tools for your generation</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-serenity transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 group">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Heart className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Mood Tracking</h3>
              <p className="text-muted-foreground">Daily check-ins and emotional pattern recognition</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-serenity transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 group relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <img src={brainAi} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">AI Companion</h3>
                <p className="text-muted-foreground">CBT-trained chatbot with personalized coping strategies</p>
              </div>
            </Card>

            <Card className="p-6 text-center hover:shadow-serenity transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 group">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Community</h3>
              <p className="text-muted-foreground">Connect with others in a safe, moderated space</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-serenity transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 group">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Privacy First</h3>
              <p className="text-muted-foreground">Your data is encrypted and secure. You own your journey</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Mindfulness Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 opacity-20">
          <img src={meditationGlow} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 text-foreground">Find Your Peace</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Discover mindfulness practices tailored for modern life
          </p>
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
            <p className="text-lg text-card-foreground leading-relaxed">
              "Serenity helped me understand my emotions better and gave me practical tools 
              to manage my anxiety. It's like having a therapist in my pocket."
            </p>
            <p className="text-primary mt-4 font-medium"></p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-14 px-4 relative overflow-hidden bg-gradient-to-r from-[#a94ddb] via-[#b94fc8] to-[#c14fb2] serenity-cta-breathe">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-20 -left-24 w-80 h-80 rounded-full bg-white/25 blur-3xl serenity-glow-float" />
          <div className="absolute -top-14 right-8 w-64 h-64 rounded-full bg-[#6f2ca7]/40 blur-3xl serenity-glow-float" style={{ animationDelay: "-2.4s" }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 pb-10 md:pb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Find Your Serenity?</h2>
          <p className="text-lg md:text-xl mb-6 text-white/90">
            Join thousands taking control of their mental wellness
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="bg-serenity-gradient hover:opacity-90 text-primary-foreground px-8 py-4 text-lg shadow-serenity transition-all duration-300 hover:scale-105 border-0"
            >
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Organic layered landscape */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-[82px] md:h-[110px]" preserveAspectRatio="none" aria-hidden="true">
            <g className="serenity-wave-back">
              <path
                d="M0,288L40,277.3C80,267,160,245,240,224C320,203,400,181,480,176C560,171,640,181,720,192C800,203,880,213,960,197.3C1040,181,1120,139,1200,133.3C1280,128,1360,160,1400,176L1440,192L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
                fill="#6f338f"
                fillOpacity="0.52"
              />
            </g>
            <g className="serenity-wave-front">
              <path
                d="M0,288L34.3,293.3C68.6,299,137,309,206,309.3C274.3,309,343,299,411,288C480,277,549,267,617,240C685.7,213,754,171,823,176C891.4,181,960,235,1029,250.7C1097.1,267,1166,245,1234,224C1302.9,203,1371,181,1406,170.7L1440,160L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"
                fill="#8b43b2"
                fillOpacity="0.78"
              />
            </g>
          </svg>
        </div>
      </section>
    </div>
  );
};

export default Landing;