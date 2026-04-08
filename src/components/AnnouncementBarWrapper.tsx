import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import AnnouncementBarClient from "./AnnouncementBarClient";

const getActiveBar = unstable_cache(
    async () =>
        prisma.announcementBar.findUnique({
            where: { id: "global" },
        }),
    ["active-announcement-bar"],
    { revalidate: 60, tags: ["announcement"] }
);

export default async function AnnouncementBarWrapper() {
    const bar = await getActiveBar();
    if (!bar?.isActive || !bar.text.trim()) return null;
    return (
        <AnnouncementBarClient
            id={`${bar.id}_${new Date(bar.updatedAt).getTime()}`}
            text={bar.text}
            link={bar.link ?? undefined}
            linkText={bar.linkText ?? undefined}
        />
    );
}
