import LoginButton from "@/component/LoginButton";
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
  return (
    <div className="flex flex-col w-screen h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Kickaas</h1>
      <p className="text-lg">
        Kickass is a platform for creating and managing events.
      </p>
      <div className="flex flex-row items-center justify-center">
        <LoginButton />
      </div>
    <div>
      <HeroSection />
      <main className="relative z-10 flex flex-col gap-32 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <FeatureHighlightsSection features={featureHighlights} />
        <WorkflowStepsSection steps={workflowSteps} />
        <BenefitsSection benefits={benefits} />
        <DemoShowcaseSection screens={demoScreens} />
        <CallToActionSection />
      </main>
    </div>
  );
}
