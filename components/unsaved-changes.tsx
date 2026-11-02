"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Editor = { dirty: boolean; pending: boolean };
type LeaveConfirmation = {
  blocked: boolean;
  pending: boolean;
  request: (action: () => void) => void;
  register?: (id: string, editor: Editor | null) => void;
};
const LeaveContext = createContext<LeaveConfirmation>({
  blocked: false,
  pending: false,
  request: (action) => action(),
});

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [editors, setEditors] = useState<Record<string, Editor>>({});
  const [action, setAction] = useState<(() => void) | null>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);
  const dirty = Object.values(editors).some((editor) => editor.dirty);
  const pending = Object.values(editors).some((editor) => editor.pending);
  const register = useCallback((id: string, editor: Editor | null) => {
    setEditors((previous) => {
      const next = { ...previous };
      if (editor) next[id] = editor;
      else delete next[id];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!dirty && !pending) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);

  // shortcut: SPA Back/Forward is not blocked by Link.onNavigate; add router-level protection with persistent proposal navigation.
  function request(next: () => void) {
    if (pending) return;
    if (dirty) setAction(() => next);
    else next();
  }

  return (
    <LeaveContext.Provider
      value={{ blocked: dirty || pending, pending, request, register }}
    >
      {children}
      <Dialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
      >
        <DialogContent initialFocus={keepEditing}>
          <DialogTitle>Discard unsaved changes?</DialogTitle>
          <DialogDescription>
            Your budget edits have not been saved. Keep editing to preserve
            them, or discard them to continue. Saved and submitted records will
            not change.
          </DialogDescription>
          <div className="flex flex-wrap gap-3">
            <Button ref={keepEditing} onClick={() => setAction(null)}>
              Keep editing
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                const next = action;
                setAction(null);
                next?.();
              }}
            >
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LeaveContext.Provider>
  );
}

export function useLeaveConfirmation() {
  return useContext(LeaveContext);
}

export function useUnsavedEditor(dirty: boolean, pending: boolean) {
  const { register } = useLeaveConfirmation();
  const id = useId();
  useEffect(() => {
    register?.(id, { dirty, pending });
  }, [register, id, dirty, pending]);
  useEffect(() => () => register?.(id, null), [register, id]);
}
