
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ReportGenerator from "@/components/ui/ReportGenerator";
import FeatureNavbar from "@/components/ui/FeatureNavbar";

const ProfilePage = () => {
  const backendUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
  const userId = backendUser?.id || backendUser?._id || null;
  const userName = backendUser?.name || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft">
      <FeatureNavbar featureName="📄 Report" />

      <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-5xl items-center px-4 py-8">
        <Card className="card-elevated w-full border-primary/20 bg-card/80 shadow-serenity-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gradient-primary">Report</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportGenerator userId={userId} userName={userName} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
