/*
 AI-generated code: 3% (tool: Codex - GPT-5, modified and adapted, functions: EventsPage) 
 Human code: 97% (functions: EventsPage, setting up the initial result and passing it to the EventsBrowser component) 
 framework-generated code: 0%
*/

export const dynamic = "force-dynamic";
import { getEvents } from "@/services/events";
import { getCategories } from "@/services/categories";
import { ClientEvents } from "@/component/events/ClientEvents";

export default async function EventsPage() {
  const [initialResult, categoriesResult] = await Promise.all([
    getEvents({ limit: 6 }),
    getCategories({ limit: 100 }),
  ]);

  return (
    <ClientEvents
      initialResult={initialResult}
      categories={categoriesResult.items}
    />
  );
}
