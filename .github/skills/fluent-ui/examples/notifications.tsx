// Feedback skeleton: Toast for transient confirmation, MessageBar for persistent messages. Rules: patterns/feedback.md.
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Toast,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
} from "@fluentui/react-components";

export function useSavedToast() {
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const notifySaved = () =>
    dispatchToast(
      <Toast>
        <ToastTitle>Changes saved</ToastTitle>
      </Toast>,
      { intent: "success" },
    );
  return { toasterId, notifySaved };
}

// Render once near the app root: <Toaster toasterId={toasterId} />
export { Toaster };

export function LoadErrorBar({ message }: { message: string }) {
  return (
    <MessageBar intent="error">
      <MessageBarBody>
        <MessageBarTitle>Loading failed</MessageBarTitle>
        {message}
      </MessageBarBody>
    </MessageBar>
  );
}
