import LandingClient from "@/components/home/LandingClient";
import { auth } from "@/auth";

export default async function LandingPage() {
    const session = await auth();
    return (
        <main className="bg-black min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
            <LandingClient session={session} />
        </main>
    );
}