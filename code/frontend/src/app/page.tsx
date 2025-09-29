"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getLoginCookie } from "@/actions/auth";
import { LayoutGroup, MotionConfig } from "framer-motion";
import { BenefitsSection } from "@/component/landing/BenefitsSection";
import { CallToActionSection } from "@/component/landing/CallToActionSection";
import { DemoShowcaseSection } from "@/component/landing/DemoShowcaseSection";
import { FeatureHighlightsSection } from "@/component/landing/FeatureHighlightsSection";
import { HeroSection } from "@/component/landing/HeroSection";
import {
  featureHighlights,
  workflowSteps,
  benefits,
  demoScreens,
} from "@/component/landing/landingData";
import { WorkflowStepsSection } from "@/component/landing/WorkflowStepsSection";

export default function Page() {
  const [cookie, setCookie] = useState<string>();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  useEffect(() => {
    if (error === "unauthorized") {
      toast.error("You are not authorized to access this page");
    }
  }, [error]);

  useEffect(() => {
    async function readCookie() {
      const nextCookie = await getLoginCookie();
      setCookie(nextCookie?.value);
    }
    readCookie();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <HeroSection cookie={cookie ?? ""} />
        <main className="relative z-10 flex flex-col gap-32 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
          <FeatureHighlightsSection features={featureHighlights} />
          <WorkflowStepsSection steps={workflowSteps} />
          <BenefitsSection benefits={benefits} />
          <DemoShowcaseSection screens={demoScreens} />
          <CallToActionSection />
        </main>
      </LayoutGroup>
    </MotionConfig>
  );
}
