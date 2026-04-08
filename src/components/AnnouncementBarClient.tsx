"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";

type Props = {
    id: string;
    text: string;
    link?: string;
    linkText?: string;
};

export default function AnnouncementBarClient({ id, text, link, linkText }: Props) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem(`announcement_dismissed_${id}`);
        if (!dismissed) setVisible(true);
    }, [id]);

    useEffect(() => {
        document.documentElement.classList.toggle("has-announcement", visible);
        return () => document.documentElement.classList.remove("has-announcement");
    }, [visible]);

    const dismiss = () => {
        localStorage.setItem(`announcement_dismissed_${id}`, "1");
        setVisible(false);
    };

    const content = (
        <span className="flex items-center gap-2 whitespace-nowrap">
            <Megaphone size={14} className="shrink-0" />
            {text}
            {link && linkText && (
                <span className="underline underline-offset-2 font-bold ml-2">{linkText} →</span>
            )}
        </span>
    );

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="sticky top-0 z-50 bg-red-600 text-white text-sm font-medium overflow-hidden"
                >
                    <div className="flex items-center">
                        {/* Marquee */}
                        <div className="flex-1 overflow-hidden py-2 pl-3">
                            <div className="animate-marquee flex gap-24 w-max">
                                {link ? (
                                    <a href={link} className="hover:opacity-80 transition-opacity">{content}</a>
                                ) : (
                                    <span>{content}</span>
                                )}
                                {/* Duplicado para loop continuo */}
                                {link ? (
                                    <a href={link} className="hover:opacity-80 transition-opacity">{content}</a>
                                ) : (
                                    <span>{content}</span>
                                )}
                            </div>
                        </div>

                        {/* Botón cerrar */}
                        <button
                            onClick={dismiss}
                            aria-label="Cerrar anuncio"
                            className="shrink-0 px-3 py-2 hover:bg-red-700 transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
