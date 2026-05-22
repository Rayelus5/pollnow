import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/user-plan";
import HelpButton from "./HelpButton";

export default async function HelpButtonWrapper() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionStatus: true, stripePriceId: true },
    });
    if (!user) return null;

    const plan = await getPlanFromUser(user);
    const eventCount = await prisma.event.count({ where: { userId: session.user.id } });
    const canCreateMore = eventCount < plan.quota;

    return <HelpButton canCreateMore={canCreateMore} />;
}
