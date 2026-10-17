"use client";

import { Dialog as Primitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;

export function DialogContent({
  className,
  children,
  ...props
}: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Backdrop className="fixed inset-0 z-50 bg-black/50" />
      <Primitive.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[85svh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-background p-6 text-foreground shadow-lg outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3"
            />
          }
        >
          <X />
          <span className="sr-only">Close</span>
        </Primitive.Close>
      </Primitive.Popup>
    </Primitive.Portal>
  );
}
