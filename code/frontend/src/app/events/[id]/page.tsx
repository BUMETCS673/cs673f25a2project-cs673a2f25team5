import { getEvent } from "@/services/events";
import { notFound } from "next/navigation";

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const event = await getEvent(id);
  return <div>{JSON.stringify(event)}</div>;
}
