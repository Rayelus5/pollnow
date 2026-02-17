import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { Bell } from "lucide-react";

export default async function AdminNotifications({ userId }: { userId: string }) {
    if (!userId) return null;

    const unreadCount = await prisma.notification.count({
        where: {
            adminUserId: userId,
            isRead: false
        }
    });

    return (
        <Link
            href="/admin/notifications"
            className="relative p-0 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute bottom-4 left-5 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-950 animate-pulse"></span>
            )}
        </Link>
    );
}