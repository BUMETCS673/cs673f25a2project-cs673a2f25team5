export type FeatureHighlight = {
  heading: string;
  description: string;
  bullets?: string[];
};

export type WorkflowStep = {
  title: string;
  body: string;
};

export type Benefit = {
  title: string;
  icon: string;
  points: string[];
};

export type DemoScreen = {
  title: string;
  description: string;
};

export const featureHighlights: FeatureHighlight[] = [
  {
    heading: "Event Creation & Management",
    description:
      "Create events in minutes. Add title, venue, dates, seating, and capacity without the spreadsheet chaos.",
  },
  {
    heading: "Ticketing & Registration",
    description:
      "Launch registration flows that sell and scan tickets seamlessly with built-in QR codes and guest tracking.",
  },
  {
    heading: "Secure Payments",
    description:
      "Collect payments globally through Stripe-powered checkout that keeps every transaction fast and protected.",
  },
  {
    heading: "Interactive Maps",
    description:
      "Help attendees discover what’s happening nearby with real-time maps and smart filtering by interest.",
  },
  {
    heading: "Analytics & Insights",
    description:
      "Monitor ticket sales, attendance, and revenue instantly with dashboards built for quick decisions.",
  },
  {
    heading: "Community Engagement",
    description:
      "Spark conversations with posts, comments, and live updates that keep every audience energized.",
  },
];

export const benefits: Benefit[] = [
  {
    title: "For Attendees",
    icon: "🎉",
    points: [
      "Discover curated events in seconds",
      "Mobile tickets and QR check-in",
      "Secure payments and instant receipts",
    ],
  },
  {
    title: "For Organizers",
    icon: "📊",
    points: [
      "Live sales and attendance tracking",
      "Seat management and capacity controls",
    ],
  },
  {
    title: "For Communities",
    icon: "🌍",
    points: [
      "Promote local experiences globally",
      "Grow memberships with recurring events",
      "Gather feedback to shape future lineups",
    ],
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Create your event",
    body: "Add details, upload visuals, and publish with a single click—no technical lift required.",
  },
  {
    title: "Sell tickets",
    body: "Share your event link and let attendees pay online with secure, multi-currency checkout.",
  },
  {
    title: "Check in & enjoy",
    body: "Scan QR codes at the door to keep lines moving and push real-time updates to your guests.",
  },
  {
    title: "Analyze & grow",
    body: "Review sales, attendance, and feedback insights to improve the next experience instantly.",
  },
];

export const demoScreens: DemoScreen[] = [
  {
    title: "Organizer dashboard",
    description:
      "See live ticket sales, revenue, and engagement in one command center view.",
  },
  {
    title: "Ticket purchase flow",
    description:
      "Mobile-first checkout with payment badges that build trust instantly.",
  },
  {
    title: "Analytics snapshot",
    description:
      "Track attendance trends, repeat buyers, and sponsorship impact.",
  },
  {
    title: "Interactive map",
    description:
      "Help attendees navigate venues and find pop-up sessions in real time.",
  },
];
