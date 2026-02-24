"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface SidebarContextProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    animate: boolean;
}

type SidebarIconElement = React.ReactElement<{ className?: string }>;

const SidebarContext = createContext<SidebarContextProps | undefined>(
    undefined
);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};

export const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
}: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    animate?: boolean;
}) => {
    const [openState, setOpenState] = useState(false);

    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    return (
        <SidebarContext.Provider value={{ open, setOpen, animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = ({
    children,
    open,
    setOpen,
    animate,
}: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    animate?: boolean;
}) => {
    return (
        <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
            {children}
        </SidebarProvider>
    );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...(props as React.ComponentProps<"div">)} />
        </>
    );
};

export const DesktopSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof motion.div>) => {
    const { open, setOpen, animate } = useSidebar();
    return (
        <motion.div
            className={cn(
                "h-full py-4 hidden md:flex md:flex-col bg-white border-r border-slate-200 w-64 flex-shrink-0 sticky top-0",
                open ? "px-4" : "px-3",
                className
            )}
            animate={{
                width: animate ? (open ? "256px" : "60px") : "256px",
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const MobileSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<"div">) => {
    const { open, setOpen } = useSidebar();
    return (
        <>
            <div
                className={cn(
                    "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-white border-b border-slate-200 w-full"
                )}
                {...props}
            >
                <div className="flex justify-end z-20 w-full">
                    <Menu
                        className="text-foreground cursor-pointer"
                        onClick={() => setOpen(!open)}
                    />
                </div>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                            }}
                            className={cn(
                                "fixed h-full w-full inset-0 bg-background p-10 z-[100] flex flex-col justify-between",
                                className
                            )}
                        >
                            <div
                                className="absolute right-10 top-10 z-50 text-foreground cursor-pointer"
                                onClick={() => setOpen(!open)}
                            >
                                <X />
                            </div>
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export const SidebarLink = ({
    link,
    className,
    active = false,
    ...props
}: {
    link: Links;
    className?: string;
    active?: boolean;
    props?: LinkProps;
}) => {
    const { open, animate } = useSidebar();

    return (
        <Link
            href={link.href}
            className={cn(
                // Base styles
                "flex items-center gap-3 group/sidebar rounded-lg py-3 transition-all duration-200 w-full outline-none border border-transparent focus-visible:ring-2 focus-visible:ring-blue-500",
                open ? "px-3" : "justify-center px-0",
                // Active vs Inactive
                active
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                className
            )}
            {...props}
        >
            <div className={cn(
                "flex items-center justify-center flex-shrink-0",
                // Ajuste sutil para centrar icono cuando está cerrado
                !open && "w-full"
            )}>
                {/* Icono con color dinámico */}
                {React.isValidElement(link.icon) && (() => {
                    const iconEl = link.icon as SidebarIconElement;
                    return React.cloneElement(iconEl, {
                        className: cn(
                            "h-5 w-5 transition-colors",
                            iconEl.props.className,
                            active ? "text-blue-600" : "text-slate-500 group-hover/sidebar:text-slate-900"
                        ),
                    });
                })()}
            </div>

            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                    width: animate ? (open ? "auto" : 0) : "auto",
                }}
                className={cn(
                    "text-sm font-semibold whitespace-pre overflow-hidden",
                    !open && "hidden"
                )}
            >
                {link.label}
            </motion.span>
        </Link>
    );
};
