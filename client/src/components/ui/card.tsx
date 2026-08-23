import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white border-2 border-dashed border-moss/25 rounded-2xl transition-all duration-300 ${className}`}
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
      <div className="bg-white border-x-2 border-dashed border-moss/25 px-6 py-5">{children}</div>
      <div className="receipt-edge h-2 w-full rotate-180" />
    </div>
  );
}
