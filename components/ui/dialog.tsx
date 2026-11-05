"use client";

import { Dialog as Primitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export function DialogTitle({ className, ...props }: Primitive.Title.Props) {
  return (
    <Primitive.Title
      data-slot="dialog-title"
      className={cn("pr-6 text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}
export function DialogDescription({
  className,
  ...props
}: Primitive.Description.Props) {
  return (
    <Primitive.Description
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Backdrop className="fixed inset-0 z-50 bg-sidebar/35 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0" />
      <Primitive.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[85svh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-card p-4 sm:p-6 text-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0",
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
