'use server';

import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyReportCreated } from "@/lib/telegram";

export async function createReport(eventId: string, reason: string, details: string) {
    const session = await auth();
    // Permitimos reportes anónimos o vinculamos al usuario si está logueado
    const reporterId = session?.user?.id;

    // if (!reporterId) {
    //     // Opcional: obligar a login para reportar, lanza error aquí.
    //     // throw new Error("Debes iniciar sesión para reportar.");
    // }

    // Nota: Como en el Schema pusimos reporterId como String (obligatorio),
    // asumiremos que solo usuarios logueados pueden reportar.
    // Si no, tendríamos que cambiar el schema a String?
    if (!reporterId) throw new Error("Login required");

    const report = await prisma.report.create({
        data: {
            eventId,
            reporterId,
            reason: reason as any,
            details,
            isReviewed: false
        },
        include: {
            event: { select: { title: true } },
            reporter: { select: { username: true } },
        },
    });

    after(() =>
        notifyReportCreated({
            reportId: report.id,
            eventId,
            eventTitle: report.event.title,
            reason: report.reason,
            reporterUsername: report.reporter.username,
        })
    );
}