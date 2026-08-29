"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_JDS } from "@/lib/mock-data";

export interface JD {
  id: string;
  companyId: string;
  companyName?: string; // added to support Excel rows without proper company ID mapping easily
  jobTitle: string;
  department: string;
  skillsRequired: string;
  salary: string;
  location?: string;
  eligibilityCriteria?: string;
  minCGPA?: string;
  jobDescription?: string;
  applicationDeadline?: string;
  jdLink?: string;
  driveDate?: string;
  status: "ACTIVE" | "PENDING" | "REJECTED";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  uploadedBy?: string;
  uploadedDate?: string;
}

export interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}

interface JDContextType {
  jds: JD[];
  addJD: (jd: Omit<JD, "id" | "status" | "approvalStatus">) => void;
  addMultipleJDs: (jds: Omit<JD, "id" | "status" | "approvalStatus">[]) => void;
  updateJDStatus: (id: string, status: JD["status"], approvalStatus: JD["approvalStatus"]) => void;
  notifications: Notification[];
  addNotification: (message: string) => void;
  markNotificationsAsRead: () => void;
}

const JDContext = createContext<JDContextType | undefined>(undefined);

export function JDProvider({ children }: { children: React.ReactNode }) {
  const [jds, setJds] = useState<JD[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from local storage or mock data
  useEffect(() => {
    const storedJDs = localStorage.getItem("placementos_jds");
    if (storedJDs) {
      try {
        setJds(JSON.parse(storedJDs));
      } catch (e) {
        console.error("Failed to parse JDs from local storage", e);
      }
    } else {
      // Map mock data to the required format
      const initialJDs = (MOCK_JDS as any[]).map((jd: any) => ({
        ...jd,
        status: "ACTIVE" as const,
        approvalStatus: "APPROVED" as const,
        uploadedBy: "System",
        uploadedDate: new Date().toISOString(),
      }));
      setJds(initialJDs);
    }

    const storedNotifs = localStorage.getItem("placementos_notifications");
    if (storedNotifs) {
      try {
        setNotifications(JSON.parse(storedNotifs));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("placementos_jds", JSON.stringify(jds));
    }
  }, [jds, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("placementos_notifications", JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  const addJD = (jdData: Omit<JD, "id" | "status" | "approvalStatus">) => {
    const newJD: JD = {
      ...jdData,
      id: `JD${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
      status: "PENDING",
      approvalStatus: "PENDING",
      uploadedBy: localStorage.getItem("userRole") || "Unknown",
      uploadedDate: new Date().toISOString(),
    };
    setJds((prev) => [newJD, ...prev]);
    addNotification(`New JD uploaded for ${newJD.companyName || newJD.companyId} and waiting for Admin approval.`);
  };

  const addMultipleJDs = (jdDataList: Omit<JD, "id" | "status" | "approvalStatus">[]) => {
    const newJDs = jdDataList.map((jdData) => ({
      ...jdData,
      id: `JD${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
      status: "PENDING" as const,
      approvalStatus: "PENDING" as const,
      uploadedBy: localStorage.getItem("userRole") || "Unknown",
      uploadedDate: new Date().toISOString(),
    }));
    setJds((prev) => [...newJDs, ...prev]);
    addNotification(`${newJDs.length} JDs imported successfully and waiting for Admin approval.`);
  };

  const updateJDStatus = (id: string, status: JD["status"], approvalStatus: JD["approvalStatus"]) => {
    setJds((prev) =>
      prev.map((jd) => (jd.id === id ? { ...jd, status, approvalStatus } : jd))
    );
  };

  const addNotification = (message: string) => {
    const newNotif: Notification = {
      id: `NOTIF${Date.now()}`,
      message,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <JDContext.Provider value={{ jds, addJD, addMultipleJDs, updateJDStatus, notifications, addNotification, markNotificationsAsRead }}>
      {children}
    </JDContext.Provider>
  );
}

export function useJD() {
  const context = useContext(JDContext);
  if (context === undefined) {
    throw new Error("useJD must be used within a JDProvider");
  }
  return context;
}
