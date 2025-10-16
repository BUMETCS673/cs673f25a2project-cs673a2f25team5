/*

 AI-generated code:  0%) 

 Human code: 100% (functions: Page) 

 No framework-generated code.

*/
import { BenefitsSection } from "@/component/landing/BenefitsSection";
import { CallToActionSection } from "@/component/landing/CallToActionSection";
import { DemoShowcaseSection } from "@/component/landing/DemoShowcaseSection";
import { FeatureHighlightsSection } from "@/component/landing/FeatureHighlightsSection";
import HeroSection from "@/component/landing/HeroSection";
import {
  featureHighlights,
  workflowSteps,
  benefits,
  demoScreens,
} from "@/component/landing/landingData";
import { WorkflowStepsSection } from "@/component/landing/WorkflowStepsSection";

export default function Page() {
  return (
    <div>
      <HeroSection />
      <main className="relative z-10 flex rounded-3xl flex-col gap-32 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <FeatureHighlightsSection features={featureHighlights} />
        <WorkflowStepsSection steps={workflowSteps} />
        <BenefitsSection benefits={benefits} />
        <DemoShowcaseSection screens={demoScreens} />
        <CallToActionSection />
      </main>
    </div>
  );
}
