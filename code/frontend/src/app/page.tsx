import Landing from "@/component/landing/Landing";

export default async function Page({ cookie }: { cookie: string }) {
  return (
    <div>
      <Landing cookie={cookie} />
    </div>
  );
}
