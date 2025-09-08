import React from "react";
import { useTokens } from "./TokenProvider";

export const TokenGate: React.FC<{ 
  required: number; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}> = ({ required, children, fallback }) => {
  const { balance } = useTokens();
  if (balance == null) return null;
  if (balance >= required) return <>{children}</>;
  return fallback ?? (
    <div className="p-4 rounded-xl border">
      <h3 className="font-semibold mb-2">You're out of tokens</h3>
      <p className="mb-3">Top up or upgrade your plan to continue.</p>
      <button className="px-4 py-2 rounded-lg bg-black text-white">View Plans</button>
    </div>
  );
};