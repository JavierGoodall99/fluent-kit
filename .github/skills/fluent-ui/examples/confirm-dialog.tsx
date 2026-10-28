// Confirmation dialog skeleton, only for destructive or irreversible actions. Rules and measurements: patterns/drawer.md.
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
} from "@fluentui/react-components";

interface Props {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({ open, count, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Confirm deletion</DialogTitle>
          <DialogContent>
            {count === 1
              ? "Are you sure you want to delete this item? This cannot be undone."
              : `Are you sure you want to delete ${count} items? This cannot be undone.`}
          </DialogContent>
          {/* Fluent 2 Web: the primary action comes first, then the different action (Cancel). Stacked on narrow screens, the primary is on top. */}
          <DialogActions>
            <Button appearance="primary" onClick={onConfirm}>
              Delete
            </Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
