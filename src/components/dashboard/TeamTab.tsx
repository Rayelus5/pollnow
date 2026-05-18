"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Lock, Crown, ShieldCheck, Settings2, Loader2, Contact } from "lucide-react";
import { AnimatePresence as AP } from "framer-motion";
import clsx from "clsx";
import Image from "next/image";
import CollaboratorCard, {
    PendingInvitationCard,
    PERMISSION_LABELS,
    type PermissionKey,
} from "./CollaboratorCard";
import InviteModal from "./InviteModal";
import { getPusherClient, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";
import type { Channel } from "pusher-js";

type CollaboratorUser = {
    id: string;
    name: string;
    username: string;
    image: string | null;
};

type CollaboratorData = {
    id: string;
    userId: string;
    user: CollaboratorUser;
    canEditSettings: boolean | null;
    canRegenerateKey: boolean | null;
    canDeleteEvent: boolean | null;
    canManageNominees: boolean | null;
    canManagePolls: boolean | null;
    canViewStats: boolean | null;
};

type PendingInvitation = {
    id: string;
    invitedUser: CollaboratorUser;
};

type EventDefaults = Record<PermissionKey, boolean>;

type Props = {
    eventId: string;
    eventTitle: string;
    planSlug: string;
    collaboratorLimit: number;
    isOwner: boolean;
    currentUserId: string;
};

const PLAN_LIMIT_INFO: Record<string, { label: string; color: string }> = {
    free: { label: "Plan gratuito", color: "text-gray-400" },
    premium: { label: "Plan Premium", color: "text-indigo-400" },
    plus: { label: "Plan Plus", color: "text-blue-400" },
    unlimited: { label: "Plan Unlimited", color: "text-purple-400" },
};

export default function TeamTab({ eventId, eventTitle, planSlug, collaboratorLimit, isOwner, currentUserId }: Props) {
    const [owner, setOwner] = useState<CollaboratorUser | null>(null);
    const [collaborators, setCollaborators] = useState<CollaboratorData[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [eventDefaults, setEventDefaults] = useState<EventDefaults>({
        canEditSettings: false,
        canRegenerateKey: false,
        canDeleteEvent: false,
        canManageNominees: true,
        canManagePolls: true,
        canViewStats: true,
    });
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showGlobalPerms, setShowGlobalPerms] = useState(false);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [localGlobal, setLocalGlobal] = useState<EventDefaults>(eventDefaults);

    // Fetch initial data
    const fetchTeam = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/collaborators/${eventId}`);
            if (!res.ok) return;
            const data = await res.json();
            setOwner(data.owner);
            setCollaborators(data.collaborators);
            setPendingInvitations(data.pendingInvitations);
            setEventDefaults(data.eventDefaults);
            setLocalGlobal(data.eventDefaults);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    // Pusher: suscribir al canal privado del evento
    useEffect(() => {
        if (typeof window === "undefined") return;
        let channel: Channel | undefined;
        try {
            const pusher = getPusherClient();
            channel = pusher.subscribe(eventChannel(eventId));

            channel.bind(PUSHER_EVENTS.COLLABORATOR_JOINED, (data: { collaborator: CollaboratorData }) => {
                // Actualizar lista sin full re-fetch
                setCollaborators((prev) => {
                    if (prev.some((c) => c.userId === (data.collaborator as unknown as CollaboratorUser).id || c.userId === data.collaborator.userId)) return prev;
                    return [...prev];
                });
                setPendingInvitations((prev) =>
                    prev.filter((i) => i.invitedUser.id !== (data.collaborator as unknown as CollaboratorUser).id)
                );
                // Re-sync completo para obtener el formato correcto con permisos
                fetchTeam();
            });

            channel.bind(PUSHER_EVENTS.COLLABORATOR_LEFT, (data: { userId: string }) => {
                setCollaborators((prev) => prev.filter((c) => c.userId !== data.userId));
            });

            channel.bind(PUSHER_EVENTS.PERMISSIONS_UPDATED, (data: {
                type: "global" | "individual";
                userId: string | null;
                permissions: Record<string, boolean>;
                triggeredBy: string;
            }) => {
                // Actualizar estado directamente desde el payload — sin fetchTeam() para evitar el loader flash
                if (data.type === "global") {
                    const newDefaults: EventDefaults = {
                        canEditSettings: data.permissions.canEditSettings ?? false,
                        canRegenerateKey: data.permissions.canRegenerateKey ?? false,
                        canDeleteEvent: data.permissions.canDeleteEvent ?? false,
                        canManageNominees: data.permissions.canManageNominees ?? true,
                        canManagePolls: data.permissions.canManagePolls ?? true,
                        canViewStats: data.permissions.canViewStats ?? true,
                    };
                    setEventDefaults(newDefaults);
                    // Solo actualizar localGlobal si no fue este usuario quien hizo el cambio
                    if (data.triggeredBy !== currentUserId) {
                        setLocalGlobal(newDefaults);
                    }
                } else if (data.type === "individual" && data.userId) {
                    setCollaborators((prev) =>
                        prev.map((c) =>
                            c.userId === data.userId
                                ? {
                                    ...c,
                                    canEditSettings: data.permissions.canEditSettings ?? null,
                                    canRegenerateKey: data.permissions.canRegenerateKey ?? null,
                                    canDeleteEvent: data.permissions.canDeleteEvent ?? null,
                                    canManageNominees: data.permissions.canManageNominees ?? null,
                                    canManagePolls: data.permissions.canManagePolls ?? null,
                                    canViewStats: data.permissions.canViewStats ?? null,
                                } as CollaboratorData
                                : c
                        )
                    );
                }
            });

            channel.bind(PUSHER_EVENTS.INVITATION_SENT, () => {
                fetchTeam();
            });
        } catch {
            // Pusher no configurado o no disponible
        }

        return () => {
            // Desenlazar solo los eventos propios de TeamTab.
            // NO llamar unbind_all() ni unsubscribe() porque EventTabs también usa
            // el mismo canal y depende de que siga suscrito y con sus listeners intactos.
            if (channel) {
                channel.unbind(PUSHER_EVENTS.COLLABORATOR_JOINED);
                channel.unbind(PUSHER_EVENTS.COLLABORATOR_LEFT);
                channel.unbind(PUSHER_EVENTS.PERMISSIONS_UPDATED);
                channel.unbind(PUSHER_EVENTS.INVITATION_SENT);
            }
        };
    }, [eventId, currentUserId, fetchTeam]);

    const handleGlobalPermToggle = (key: PermissionKey) => {
        setLocalGlobal((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveGlobalPerms = async () => {
        setSavingGlobal(true);
        await fetch(`/api/collaborators/${eventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "global", permissions: localGlobal }),
        });
        setEventDefaults(localGlobal);
        setSavingGlobal(false);
    };

    const isFreeAndOwner = isOwner && planSlug === "free";
    const planInfo = PLAN_LIMIT_INFO[planSlug] ?? PLAN_LIMIT_INFO.free;
    const usedSlots = collaborators.length + pendingInvitations.length;
    const canInviteMore = isOwner && collaboratorLimit > 0 && usedSlots < collaboratorLimit;

    return (
        <div className="max-w-7xl tour-team-section">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Contact className="w-6 h-6 text-gray-400" />
                        <h2 className="text-xl font-bold">Equipo del evento</h2>
                    </div>
                    <p className="text-sm text-gray-500">
                        Gestiona quién puede colaborar en <span className="text-gray-300 font-medium">{eventTitle}</span>
                    </p>
                </div>

                {isOwner && !isFreeAndOwner && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        disabled={!canInviteMore}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-md font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-900/20"
                    >
                        <UserPlus className="w-5 h-5" />
                        Invitar
                    </button>
                )}
            </div>

            {/* Plan badge + slots */}
            {isOwner && (
                <div className="flex items-center justify-between mb-6 px-4 py-3 rounded-xl border-2 border-white/8 bg-neutral-900/40">
                    <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-gray-500" />
                        <span className={clsx("text-xs font-bold uppercase tracking-wider", planInfo.color)}>
                            {planInfo.label}
                        </span>
                    </div>
                    {collaboratorLimit > 0 ? (
                        <div className="text-xs text-gray-400">
                            <span className={clsx("font-bold", usedSlots >= collaboratorLimit ? "text-red-400" : "text-white")}>
                                {usedSlots}
                            </span>
                            <span className="text-gray-600"> / {collaboratorLimit} colaboradores</span>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-600">Sin acceso a colaboración</span>
                    )}
                </div>
            )}

            {/* Estado BLOQUEADO para plan FREE (dueño) */}
            {isFreeAndOwner && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border-2 border-dashed border-white/15 bg-neutral-900/30 p-8 text-center mb-8"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-7 h-7 text-gray-500" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Función Premium</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
                        Con el plan gratuito no puedes invitar colaboradores. Actualiza tu suscripción para desbloquear esta función.
                    </p>
                    <a
                        href="/premium"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        Ver planes
                    </a>
                </motion.div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Dueño del evento (siempre visible, no removible) */}
                    {owner && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-amber-500/20 bg-amber-500/5">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden shrink-0">
                                {owner.image ? (
                                    <Image
                                        src={owner.image}
                                        alt={owner.name}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                        {owner.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate">{owner.name}</p>
                                <p className="text-xs text-gray-500 truncate">@{owner.username}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full shrink-0">
                                <Crown className="w-3 h-3" />
                                Dueño
                            </span>
                        </div>
                    )}

                    {/* Lista de colaboradores */}
                    <AnimatePresence initial={false}>
                        {collaborators.map((c) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CollaboratorCard
                                    collaborator={c}
                                    eventId={eventId}
                                    eventDefaults={eventDefaults}
                                    isOwner={isOwner}
                                    onRemoved={(userId) =>
                                        setCollaborators((prev) => prev.filter((x) => x.userId !== userId))
                                    }
                                    onPermissionsChanged={(userId, perms) =>
                                        setCollaborators((prev) =>
                                            prev.map((x) =>
                                                x.userId === userId ? { ...x, ...perms } as CollaboratorData : x
                                            )
                                        )
                                    }
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Invitaciones pendientes */}
                    {pendingInvitations.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 px-1 pt-2">
                                Invitaciones pendientes
                            </p>
                            {pendingInvitations.map((inv) => (
                                <PendingInvitationCard key={inv.id} invitation={inv} />
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {collaborators.length === 0 && pendingInvitations.length === 0 && !isFreeAndOwner && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 text-center border-2 border-dashed border-white/10 rounded-xl"
                        >
                            <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Aún no hay colaboradores</p>
                            {isOwner && canInviteMore && (
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                >
                                    Invitar al primer colaborador
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            )}

            {/* Permisos globales (solo owner, no free) */}
            {isOwner && !isFreeAndOwner && (
                <div className="mt-8">
                    <button
                        onClick={() => setShowGlobalPerms(!showGlobalPerms)}
                        className={clsx(
                            "flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer",
                            showGlobalPerms
                                ? "border-blue-500/30 text-blue-300 bg-blue-500/8"
                                : "border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                        )}
                    >
                        <Settings2 className="w-4 h-4" />
                        Permisos globales por defecto
                        <ShieldCheck className="w-4 h-4 ml-auto opacity-50" />
                    </button>

                    <AnimatePresence>
                        {showGlobalPerms && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 p-4 rounded-xl border-2 border-white/8 bg-neutral-900/40 space-y-3">
                                    <p className="text-xs text-gray-500 mb-3">
                                        Estos permisos aplican a todos los colaboradores que no tengan permisos individuales asignados.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {(Object.keys(PERMISSION_LABELS) as PermissionKey[]).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => handleGlobalPermToggle(key)}
                                                className={clsx(
                                                    "flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 text-left transition-all cursor-pointer",
                                                    localGlobal[key]
                                                        ? "border-blue-500/30 bg-blue-500/8 hover:bg-blue-500/15"
                                                        : "border-white/8 bg-neutral-800/50 hover:bg-neutral-800"
                                                )}
                                            >
                                                <div>
                                                    <p className={clsx("text-[11px] font-semibold", localGlobal[key] ? "text-blue-300" : "text-gray-400")}>
                                                        {PERMISSION_LABELS[key].label}
                                                    </p>
                                                    <p className="text-[10px] text-gray-600">{PERMISSION_LABELS[key].description}</p>
                                                </div>
                                                <div className={clsx("w-8 h-4 rounded-full relative transition-colors shrink-0", localGlobal[key] ? "bg-blue-500" : "bg-neutral-700")}>
                                                    <div className={clsx("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", localGlobal[key] ? "left-4.5" : "left-0.5")} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <button
                                            onClick={handleSaveGlobalPerms}
                                            disabled={savingGlobal}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            {savingGlobal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                            Guardar permisos globales
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal de invitación */}
            <AP>
                {showInviteModal && (
                    <InviteModal
                        eventId={eventId}
                        onClose={() => setShowInviteModal(false)}
                        onInvited={(user) => {
                            setPendingInvitations((prev) => [
                                ...prev,
                                { id: `pending-${Date.now()}`, invitedUser: user },
                            ]);
                        }}
                    />
                )}
            </AP>
        </div>
    );
}
