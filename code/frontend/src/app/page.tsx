import LoginButton from "@/component/LoginButton";

export default function Home() {
  return (
    <div className="flex flex-col w-screen h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Kickaas</h1>
      <p className="text-lg">
        Kickass is a platform for creating and managing events.
      </p>
      <div className="flex flex-row items-center justify-center">
        <LoginButton />
      </div>
    </div>
  );
}
