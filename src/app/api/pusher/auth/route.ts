import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    // Canal privado de usuario: private-user-{userId}
    if (channelName.startsWith("private-user-")) {
        const userId = channelName.replace("private-user-", "");
        if (userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado para este canal" }, { status: 403 });
        }
        const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
            user_id: session.user.id,
            user_info: { name: session.user.name },
        });
        return NextResponse.json(authResponse);
    }

    // Canal privado de evento: private-event-{eventId}
    const eventId = channelName.replace("private-event-", "");

    const [event, collaborator] = await Promise.all([
        prisma.event.findUnique({ where: { id: eventId }, select: { userId: true } }),
        prisma.eventCollaborator.findUnique({
            where: { eventId_userId: { eventId, userId: session.user.id } },
        }),
    ]);

    const isOwner = event?.userId === session.user.id;
    const isAdmin =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    if (!isOwner && !collaborator && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para este canal" }, { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
        user_id: session.user.id,
        user_info: { name: session.user.name },
    });

    return NextResponse.json(authResponse);
}
