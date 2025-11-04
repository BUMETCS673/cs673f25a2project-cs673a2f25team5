/*
 AI-generated code: 3% (tool: Codex - GPT-5, modified and adapted, functions: EventsPage) 
 Human code: 97% (functions: EventsPage, setting up the initial result and passing it to the EventsBrowser component) 
 framework-generated code: 0%
*/

export const dynamic = "force-dynamic";
import { getEvents } from "@/services/events";
import { ClientEvents } from "@/component/events/ClientEvents";

export default async function EventsPage() {
  const initialResult = await getEvents({ limit: 6 });
  return <ClientEvents initialResult={initialResult} />;
}
