// Edit drawer skeleton: a quick edit of one record beside the list; Save is the one primary. Rules and measurements: patterns/drawer.md.
import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  Input,
  OverlayDrawer,
  Textarea,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (values: { name: string; description: string }) => void;
}

export function EditDrawer({ open, onClose, onSave }: Props) {
  const styles = useStyles();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameError = name.trim() === "" ? "Name is required" : undefined;

  return (
    <OverlayDrawer open={open} position="end" onOpenChange={(_, data) => !data.open && onClose()}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={onClose}
            />
          }
        >
          Edit item
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        <div className={styles.form}>
          <Field
            label="Name"
            required
            validationState={nameError ? "error" : "none"}
            validationMessage={nameError}
          >
            <Input value={name} onChange={(_, d) => setName(d.value)} />
          </Field>
          <Field label="Description" hint="Optional">
            <Textarea value={description} onChange={(_, d) => setDescription(d.value)} />
          </Field>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button
          appearance="primary"
          disabled={!!nameError}
          onClick={() => onSave({ name, description })}
        >
          Save
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </DrawerFooter>
    </OverlayDrawer>
  );
}
