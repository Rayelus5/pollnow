"use client";
import { useEffect, useState } from "react";

export default function Countdown({ targetDate, onEnd }: { targetDate: Date, onEnd: () => void }) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("00:00:00");
                onEnd();
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Formato simple HH:MM:SS
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onEnd]);

    // Evitamos hydration mismatch mostrando nada al principio si quieres, o un loader
    if (!timeLeft) return <span className="opacity-0">--:--:--</span>;

    return (
        <div className="text-xl md:text-2xl font-mono font-bold text-indigo-600 animate-pulse tracking-widest">
            {timeLeft}
        </div>
    );
}