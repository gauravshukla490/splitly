import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white/70 border border-paper-line shadow-[0_1px_0_rgba(0,0,0,0.03)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ReceiptCard({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`relative ${className}`} {...props}>
      <div className="receipt-edge h-2 w-full" />
      <div className="bg-white/70 border-x border-paper-line px-6 py-5">{children}</div>
      <div className="receipt-edge h-2 w-full rotate-180" />
    </div>
  );
}
