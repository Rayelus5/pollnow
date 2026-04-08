"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, Loader2, Shield, Clock, UserMinus, X } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";

export type PermissionKey =
    | "canEditSettings"
    | "canRegenerateKey"
    | "canDeleteEvent"
    | "canManageNominees"
    | "canManagePolls"
    | "canViewStats";

export const PERMISSION_LABELS: Record<PermissionKey, { label: string; description: string }> = {
    canEditSettings: { label: "Configuración", description: "Editar nombre, fecha, privacidad" },
    canRegenerateKey: { label: "Regenerar clave", description: "Cambiar el enlace privado del evento" },
    canDeleteEvent: { label: "Eliminar evento", description: "Borrar el evento permanentemente" },
    canManageNominees: { label: "Nominados", description: "Crear y editar participantes" },
    canManagePolls: { label: "Categorías", description: "Crear y editar categorías de votación" },
    canViewStats: { label: "Estadísticas", description: "Ver resultados y métricas" },
};

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

type EventDefaults = Record<PermissionKey, boolean>;

type Props = {
    collaborator: CollaboratorData;
    eventId: string;
    eventDefaults: EventDefaults;
    isOwner: boolean;
    onRemoved: (userId: string) => void;
    onPermissionsChanged: (userId: string, perms: Partial<Record<PermissionKey, boolean | null>>) => void;
};

export default function CollaboratorCard({
    collaborator,
    eventId,
    eventDefaults,
    isOwner,
    onRemoved,
    onPermissionsChanged,
}: Props) {
    const [expanded, setExpanded] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [savingPerm, setSavingPerm] = useState(false);

    // Permisos locales (null = heredar del evento)
    const [localPerms, setLocalPerms] = useState<Partial<Record<PermissionKey, boolean | null>>>({
        canEditSettings: collaborator.canEditSettings,
        canRegenerateKey: collaborator.canRegenerateKey,
        canDeleteEvent: collaborator.canDeleteEvent,
        canManageNominees: collaborator.canManageNominees,
        canManagePolls: collaborator.canManagePolls,
        canViewStats: collaborator.canViewStats,
    });

    // Sincronizar con cambios externos (Pusher) cuando el prop del colaborador cambia
    useEffect(() => {
        if (savingPerm) return;
        setLocalPerms({
            canEditSettings: collaborator.canEditSettings,
            canRegenerateKey: collaborator.canRegenerateKey,
            canDeleteEvent: collaborator.canDeleteEvent,
            canManageNominees: collaborator.canManageNominees,
            canManagePolls: collaborator.canManagePolls,
            canViewStats: collaborator.canViewStats,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        collaborator.canEditSettings,
        collaborator.canRegenerateKey,
        collaborator.canDeleteEvent,
        collaborator.canManageNominees,
        collaborator.canManagePolls,
        collaborator.canViewStats,
    ]);

    const effectivePermissions = Object.fromEntries(
        (Object.keys(PERMISSION_LABELS) as PermissionKey[]).map((key) => [
            key,
            localPerms[key] ?? eventDefaults[key],
        ])
    ) as Record<PermissionKey, boolean>;

    const handleRemove = async () => {
        setRemoving(true);
        await fetch(`/api/collaborators/${eventId}?userId=${collaborator.userId}`, { method: "DELETE" });
        onRemoved(collaborator.userId);
    };

    const handlePermToggle = async (key: PermissionKey) => {
        if (!isOwner) return;
        const current = localPerms[key] ?? eventDefaults[key];
        const newVal = !current;
        // Si el nuevo valor coincide con el default del evento, volver a heredar (null)
        const resolvedVal: boolean | null = newVal === eventDefaults[key] ? null : newVal;
        const updated = { ...localPerms, [key]: resolvedVal };
        setLocalPerms(updated);
        setSavingPerm(true);

        await fetch(`/api/collaborators/${eventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "individual",
                userId: collaborator.userId,
                permissions: Object.fromEntries(
                    (Object.keys(PERMISSION_LABELS) as PermissionKey[]).map((k) => [k, updated[k] ?? null])
                ),
            }),
        });
        setSavingPerm(false);
        onPermissionsChanged(collaborator.userId, updated);
    };

    return (
        <motion.div
            layout
            className="border-2 border-white/10 rounded-xl overflow-hidden bg-neutral-900/50"
        >
            {/* Header de la card */}
            <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden shrink-0">
                    {collaborator.user.image ? (
                        <Image
                            src={collaborator.user.image}
                            alt={collaborator.user.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-300">
                            {collaborator.user.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{collaborator.user.name}</p>
                    <p className="text-[11px] text-gray-500">@{collaborator.user.username}</p>
                </div>

                <div className="flex items-center gap-2">
                    {savingPerm && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}

                    {isOwner && (
                        <>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border-2 transition-all cursor-pointer",
                                    expanded
                                        ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                                        : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                )}
                            >
                                <Shield className="w-3 h-3" />
                                Permisos
                                <ChevronDown
                                    className={clsx("w-3 h-3 transition-transform", expanded && "rotate-180")}
                                />
                            </button>
                            <button
                                onClick={() => setShowRemoveConfirm(true)}
                                disabled={removing}
                                className="w-7 h-7 rounded-lg border-2 border-red-500/20 text-red-500/60 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                            >
                                {removing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            <AnimatePresence>
                {showRemoveConfirm && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => !removing && setShowRemoveConfirm(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />

                        {/* Dialog */}
                        <motion.div
                            className="relative w-full max-w-sm bg-neutral-900 border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 16 }}
                            transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b-2 border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
                                        <UserMinus className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-white text-sm">Eliminar colaborador</h2>
                                        <p className="text-[11px] text-gray-500">Esta acción no se puede deshacer</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowRemoveConfirm(false)}
                                    disabled={removing}
                                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5">
                                {/* Avatar + nombre del colaborador */}
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border-2 border-red-500/15 mb-4">
                                    <div className="w-9 h-9 rounded-full bg-neutral-700 overflow-hidden shrink-0">
                                        {collaborator.user.image ? (
                                            <Image
                                                src={collaborator.user.image}
                                                alt={collaborator.user.name}
                                                width={36}
                                                height={36}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-300">
                                                {collaborator.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{collaborator.user.name}</p>
                                        <p className="text-[11px] text-gray-500">@{collaborator.user.username}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Al eliminar a este colaborador perderá el acceso al evento y todos sus permisos asociados.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowRemoveConfirm(false)}
                                    disabled={removing}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 border-2 border-white/10 transition-all cursor-pointer disabled:opacity-40"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRemove}
                                    disabled={removing}
                                    className="px-5 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {removing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    {removing ? "Eliminando…" : "Sí, eliminar"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Permisos expandibles */}
            <AnimatePresence>
                {expanded && isOwner && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t-2 border-white/10 px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(Object.keys(PERMISSION_LABELS) as PermissionKey[]).map((key) => {
                                const isInherited = localPerms[key] === null || localPerms[key] === undefined;
                                const effective = effectivePermissions[key];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handlePermToggle(key)}
                                        className={clsx(
                                            "flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 text-left transition-all cursor-pointer",
                                            effective
                                                ? "border-green-500/30 bg-green-500/8 hover:bg-green-500/15"
                                                : "border-white/8 bg-neutral-800/50 hover:bg-neutral-800"
                                        )}
                                    >
                                        <div>
                                            <p className={clsx("text-[11px] font-semibold", effective ? "text-green-300" : "text-gray-400")}>
                                                {PERMISSION_LABELS[key].label}
                                            </p>
                                            <p className="text-[10px] text-gray-600">{PERMISSION_LABELS[key].description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div
                                                className={clsx(
                                                    "w-8 h-4 rounded-full relative transition-colors",
                                                    effective ? "bg-green-500" : "bg-neutral-700"
                                                )}
                                            >
                                                <div
                                                    className={clsx(
                                                        "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                                                        effective ? "left-4.5" : "left-0.5"
                                                    )}
                                                />
                                            </div>
                                            {isInherited && (
                                                <span className="text-[9px] text-gray-600">heredado</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Tarjeta para invitaciones pendientes ──────────────────────────────────────
export function PendingInvitationCard({
    invitation,
}: {
    invitation: {
        id: string;
        invitedUser: CollaboratorUser;
    };
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-white/10 rounded-xl bg-neutral-900/30 opacity-70">
            <div className="w-9 h-9 rounded-full bg-neutral-700 overflow-hidden shrink-0">
                {invitation.invitedUser.image ? (
                    <Image
                        src={invitation.invitedUser.image}
                        alt={invitation.invitedUser.name}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                        {invitation.invitedUser.name.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-300 truncate">{invitation.invitedUser.name}</p>
                <p className="text-[11px] text-gray-500">@{invitation.invitedUser.username}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-yellow-500/70 bg-yellow-500/10 border-2 border-yellow-500/20 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                Pendiente
            </div>
        </div>
    );
}
