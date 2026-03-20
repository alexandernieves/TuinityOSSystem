'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
            <div className="relative flex flex-col items-center">
                {/* Logo Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.8,
                        ease: [0, 0.71, 0.2, 1.01],
                        scale: {
                            type: "spring",
                            damping: 12,
                            stiffness: 100,
                            restDelta: 0.001
                        }
                    }}
                    className="mb-8"
                >
                    <div className="relative h-20 w-20 md:h-24 md:w-24">
                        <Image
                            src="/tuinity-logo.svg"
                            alt="Tuinity Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </motion.div>



                {/* Loading Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="mt-6 flex flex-col items-center gap-2"
                >
                    <span className="text-sm font-medium tracking-widest text-foreground/80 uppercase">
                        Iniciando Sistema
                    </span>
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="h-1 w-1 rounded-full bg-primary"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Background patterns for a premium feel */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
            </div>
        </div>
    );
}
