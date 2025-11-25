import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ chatId: string }> } // 👈 params es Promise
) {
    // 👇 HAY QUE DESENVOLVERLO
    const { chatId } = await params;

    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const chat = await prisma.supportChat.findUnique({
        where: { id: chatId },
        include: {
            user: true,
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!chat) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const isAdminOrMod =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    const isParticipant =
        session.user.id === chat.userId || session.user.id === chat.adminId;

    if (!isAdminOrMod && !isParticipant) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const messages = chat.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        sender: {
            id: m.sender.id,
            name: m.sender.name,
        },
    }));

    return NextResponse.json(messages);
}
