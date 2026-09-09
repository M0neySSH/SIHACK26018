"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "officer";

export interface RoleContextType {
  role: UserRole;
  roleName: string;
  roleId: string;
  userTitle: string;
  switchRole: (newRole: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = "bhumidrishti_user_role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("admin");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (saved === "admin" || saved === "officer") {
      setRole(saved);
    }
  }, []);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  };

  const roleName =
    role === "admin"
      ? "District Revenue Officer (Admin)"
      : "Revenue Officer / Auditor";

  const roleId = role === "admin" ? "AD" : "RO";

  const userTitle =
    role === "admin"
      ? "Supervisory & Reviewer Mode"
      : "Field Verification & Audit Mode";

  return (
    <RoleContext.Provider
      value={{
        role,
        roleName,
        roleId,
        userTitle,
        switchRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
