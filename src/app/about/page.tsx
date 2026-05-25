import { getCurrentUserPlan } from "@/lib/user-plan";
import AboutClient from "@/components/about/AboutClient";

export default async function AboutPage() {
    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium";

    return <AboutClient showAds={showAds} />;
}
