import React from "react";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";

interface OutOfTokensModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance?: number;
}

export function OutOfTokensModal({ open, onClose, currentBalance = 0 }: OutOfTokensModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/plans");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          You're out of tokens
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          You need more tokens to use this feature. Your current balance is {currentBalance} tokens.
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Get a plan or earn more tokens to continue practicing.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleUpgrade} className="flex-1">
            View Plans
          </Button>
          <Button 
            onClick={onClose} 
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}