"use client";

import React from "react";
import { RoleProvider } from "@/lib/context/roleContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleProvider>{children}</RoleProvider>;
}
