"use client";

import type React from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Home,
  RefreshCw,
  ArrowLeft,
  LogOut,
  UserCog,
  FolderCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import UserAvatar from "@/components/ui/user-avatar";
import Link from "next/link";
import Image from "next/image";

interface PermissionDeniedScreenProps {
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  title?: string;
}

const PermissionDeniedScreen: React.FC<PermissionDeniedScreenProps> = ({
  message = "You don't have permission to access this resource.",
  onRetry,
  showHomeButton = true,
  showBackButton = true,
  title = "Access Denied",
}) => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [nextCheckIn, setNextCheckIn] = useState(60);

  // Countdown timer for automatic retry
  useEffect(() => {
    if (!onRetry) return;

    let timer: NodeJS.Timeout;
    if (timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else {
      onRetry();
      setTimeRemaining(5);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeRemaining, onRetry]);

  // Timer for next automatic check
  useEffect(() => {
    const timer = setInterval(() => {
      setNextCheckIn((prev) => {
        if (prev <= 1) {
          return 60; // Reset to 60 seconds after reaching 0
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset countdown when retry is clicked manually
  const handleRetry = () => {
    if (onRetry) {
      setTimeRemaining(5);
      setNextCheckIn(60);
      onRetry();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header bar with user profile */}
      <div className="w-full p-4 bg-black/20 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">Diplomat Corner</span>
        </div>
        {isLoaded && user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end text-sm">
              <span className="font-medium">{user.fullName}</span>
              <span className="text-xs text-gray-400">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
            <UserButton />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md mx-auto px-6">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"
              animate={{
                x: [0, 10, 0],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"
              animate={{
                x: [0, -10, 0],
                y: [0, 10, 0],
              }}
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          </div>

          {/* Main content card */}
          <motion.div
            className="relative z-10 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-8 shadow-xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Error icon with animation */}
            <motion.div
              className="flex justify-center mb-6"
              variants={iconVariants}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl"></div>
                <div className="relative bg-amber-900/50 rounded-full p-4">
                  <ShieldAlert className="h-16 w-16 text-amber-500" />
                </div>
              </div>
            </motion.div>

            {/* Title and message */}
            <motion.div className="text-center" variants={itemVariants}>
              <h1 className="text-2xl font-bold text-amber-500 mb-2">
                {title}
              </h1>
              <p className="text-gray-300 mb-4">{message}</p>
              <div className="bg-gray-700/40 rounded-md p-3 mb-6 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />
                <span className="text-sm text-amber-300">
                  Next automatic check in{" "}
                  <span className="font-bold">{nextCheckIn}</span> seconds
                </span>
              </div>
            </motion.div>

            {/* User info if available */}
            {isLoaded && user && (
              <motion.div
                className="mb-6 p-4 bg-gray-700/50 rounded-xl"
                variants={itemVariants}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <UserAvatar
                      imageUrl={user.imageUrl}
                      alt={user.fullName || "User"}
                      size={48}
                      fallbackInitials={user.fullName?.substring(0, 2) || "U"}
                      className="w-12 h-12 rounded-full border-2 border-amber-500/50"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{user.fullName}</h3>
                    <p className="text-sm text-gray-400">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <UserCog className="h-5 w-5 text-gray-400" />
                </div>
              </motion.div>
            )}

            {/* Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              {onRetry && (
                <Button
                  onClick={handleRetry}
                  className="bg-amber-600 hover:bg-amber-700 text-white group flex items-center gap-2 transition-all duration-300 w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 group-hover:animate-spin" />
                  <span>Try Again</span>
                </Button>
              )}

              <SignOutButton>
                <Button
                  variant="destructive"
                  className="group flex items-center gap-2 transition-all duration-300 w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Sign Out</span>
                </Button>
              </SignOutButton>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full p-4 bg-black/30 backdrop-blur-sm text-center text-sm text-gray-400">
        <div className="px-10 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Diplomat Corner. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="https://sydek.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <FolderCode className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
              <span>Developed By Sydek</span>
            </Link>
            <Link
              href="https://sydek.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Image
                src="/images/sydek-logo.png"
                alt="sydek logo"
                width={30}
                height={30}
                className="rounded-lg opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDeniedScreen;
