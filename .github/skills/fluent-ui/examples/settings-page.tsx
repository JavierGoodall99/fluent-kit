// Settings page: a few preferences, changed occasionally, saved once with one Save for the whole page.
// Use when the requirement is "let a person review and change their preferences". Not for a record someone edits (use the edit drawer).
// Pattern from the Microsoft 365 UI Kit "Settings" and "Form" templates (web and mobile), built by Copilot from the kit rules and then tidied.
// Rules this example follows:
//  - One centred column (480px). Sections with a header and a short description, each a group of 48px rows on white against the tinted canvas.
//  - Row = label at the start, control at the end: a switch, a checkbox or radio at the start, or the current value plus a chevron that opens a detail view.
//  - Detail views are real routes (hash links), so the browser's and the phone's back button work. The choice stays in the draft; nothing is saved until Save.
//  - Save and Discard are disabled until something changed. The footer is sticky. On a phone the buttons are large, full width, Save on top;
//    on desktop they are right-aligned, Discard then Save.
//  - A failed save shows a MessageBar at the top of the column, keeps the edits, and offers Retry. A successful save shows a toast.
//  - Every visible string is English here. Use the project's language and wording.
// Replace saveSettings with the real request. It is simulated here and fails when the browser is offline.
import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  Button,
  Checkbox,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Radio,
  RadioGroup,
  Spinner,
  Switch,
  Text,
  Toast,
  ToastTitle,
  Toaster,
  makeStyles,
  mergeClasses,
  tokens,
  useId,
  useToastController,
} from "@fluentui/react-components";
import { ChevronRight20Regular, Dismiss20Regular } from "@fluentui/react-icons";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from "react";

interface Choice { id: string; label: string }
interface Settings {
  language: string;
  keyboardLayout: string;
  desktop: boolean;
  email: boolean;
  sms: boolean;
  autoStart: boolean;
  openInBackground: boolean;
  disableGpu: boolean;
}

const LANGUAGES: Choice[] = [
  { id: "en", label: "English" },
  { id: "nl", label: "Nederlands" },
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français" },
];
const KEYBOARD_LAYOUTS: Choice[] = [
  { id: "us", label: "English (US)" },
  { id: "uk", label: "English (UK)" },
  { id: "de", label: "German (QWERTZ)" },
  { id: "fr", label: "French (AZERTY)" },
];

let persisted: Settings = { language: "en", keyboardLayout: "us", desktop: true, email: true, sms: false, autoStart: false, openInBackground: false, disableGpu: false };
const getSavedSettings = () => persisted;
const saveSettings = (next: Settings) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return reject(new Error("offline"));
      persisted = next;
      resolve();
    }, 600),
  );

type View = "main" | "language" | "keyboard";
type SaveState = "idle" | "saving" | "error";

const ROOT_HASH = "#settings";

const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

function useView(): View {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  if (hash === `${ROOT_HASH}/language`) return "language";
  if (hash === `${ROOT_HASH}/keyboard`) return "keyboard";
  return "main";
}

const NARROW_QUERY = "(max-width: 639px)";

function useIsNarrow(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(NARROW_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

const labelOf = (choices: Choice[], id: string) => choices.find((choice) => choice.id === id)?.label ?? id;
const isDirty = (draft: Settings, saved: Settings) => (Object.keys(draft) as (keyof Settings)[]).some((key) => draft[key] !== saved[key]);

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground2,
    paddingTop: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    "@media (min-width: 640px)": {
      paddingTop: tokens.spacingVerticalXXL,
      paddingLeft: tokens.spacingHorizontalXXL,
      paddingRight: tokens.spacingHorizontalXXL,
    },
  },
  column: { display: "flex", flexDirection: "column", flexGrow: 1, width: "100%", maxWidth: "480px", minWidth: 0, rowGap: tokens.spacingVerticalXL },
  detailColumn: { paddingBottom: tokens.spacingVerticalXXL },
  form: { display: "flex", flexDirection: "column", flexGrow: 1, rowGap: tokens.spacingVerticalXL },
  header: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
  title: { margin: 0, outlineStyle: "none" },
  description: { color: tokens.colorNeutralForeground3 },
  section: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  sectionHeader: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
  sectionTitle: { margin: 0 },
  // The breadcrumb's first button has inner padding; pull it back so its text lines up with the title below it.
  breadcrumb: { marginLeft: `calc(-1 * ${tokens.spacingHorizontalSNudge})` },
  group: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow4,
    overflowX: "hidden",
  },
  row: {
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    ":last-child": { borderBottom: "none" },
  },
  rowItem: {
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    width: "100%",
    minHeight: "48px",
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  rowLabel: { flexGrow: 1, alignSelf: "stretch", display: "flex", alignItems: "center", paddingLeft: 0 },
  rowItemIndicator: { paddingLeft: tokens.spacingHorizontalXS, alignItems: "center" },
  checkboxIndicator: { alignSelf: "center" },
  navRow: {
    maxWidth: "none",
    justifyContent: "flex-start",
    columnGap: tokens.spacingHorizontalS,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    textAlign: "left",
  },
  navLabel: { flexGrow: 1 },
  navValue: { color: tokens.colorNeutralForeground3, textAlign: "right", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" },
  error: { scrollMarginTop: tokens.spacingVerticalL },
  footer: {
    position: "sticky",
    bottom: 0,
    marginTop: "auto",
    display: "flex",
    flexDirection: "column-reverse",
    rowGap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalL,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    "@media (min-width: 640px)": {
      flexDirection: "row",
      justifyContent: "flex-end",
      columnGap: tokens.spacingHorizontalS,
      paddingBottom: tokens.spacingVerticalXL,
    },
  },
  footerButton: { width: "100%", "@media (min-width: 640px)": { width: "auto" } },
});

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const styles = useStyles();
  const titleId = useId("section");
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.sectionHeader}>
        <Text as="h2" id={titleId} size={300} weight="semibold" className={styles.sectionTitle}>{title}</Text>
        <Text className={styles.description}>{description}</Text>
      </div>
      <div role="group" aria-labelledby={titleId} className={styles.group}>{children}</div>
    </section>
  );
}

function NavRow({ view, label, value, linkRef }: { view: "language" | "keyboard"; label: string; value: string; linkRef: Ref<HTMLAnchorElement> }) {
  const styles = useStyles();
  return (
    <div className={styles.row}>
      <Button as="a" ref={linkRef} href={`${ROOT_HASH}/${view}`} appearance="subtle" iconPosition="after" icon={<ChevronRight20Regular />} className={mergeClasses(styles.rowItem, styles.navRow)}>
        <span className={styles.navLabel}>{label}</span>
        <span className={styles.navValue}>{value}</span>
      </Button>
    </div>
  );
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const styles = useStyles();
  return (
    <div className={styles.row}>
      <Switch className={styles.rowItem} labelPosition="before" label={{ children: label, className: styles.rowLabel }} checked={checked} onChange={(_, data) => onChange(data.checked)} />
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const styles = useStyles();
  return (
    <div className={styles.row}>
      <Checkbox
        className={mergeClasses(styles.rowItem, styles.rowItemIndicator)}
        label={{ children: label, className: styles.rowLabel }}
        indicator={{ className: styles.checkboxIndicator }}
        checked={checked}
        onChange={(_, data) => onChange(data.checked === true)}
      />
    </div>
  );
}

// A detail view: breadcrumb back to the page, title, description and one radio list. Focus moves to the title when it opens.
function DetailView({ title, description, choices, value, onChange }: { title: string; description: string; choices: Choice[]; value: string; onChange: (id: string) => void }) {
  const styles = useStyles();
  const headingId = useId("heading");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, []);

  return (
    <main className={styles.page}>
      <div className={mergeClasses(styles.column, styles.detailColumn)}>
        <Breadcrumb aria-label="Breadcrumb" className={styles.breadcrumb}>
          <BreadcrumbItem>
            <BreadcrumbButton onClick={() => (window.location.hash = ROOT_HASH)}>Settings</BreadcrumbButton>
          </BreadcrumbItem>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <BreadcrumbButton current>{title}</BreadcrumbButton>
          </BreadcrumbItem>
        </Breadcrumb>

        <header className={styles.header}>
          <Text as="h1" id={headingId} size={500} weight="semibold" tabIndex={-1} ref={headingRef} className={styles.title}>{title}</Text>
          <Text className={styles.description}>{description}</Text>
        </header>

        <RadioGroup aria-labelledby={headingId} className={styles.group} value={value} onChange={(_, data) => onChange(data.value)}>
          {choices.map((choice) => (
            <Radio key={choice.id} value={choice.id} label={{ children: choice.label, className: styles.rowLabel }} className={mergeClasses(styles.row, styles.rowItem, styles.rowItemIndicator)} />
          ))}
        </RadioGroup>
      </div>
    </main>
  );
}

export function SettingsPage() {
  const styles = useStyles();
  const view = useView();
  const narrow = useIsNarrow();
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [saved, setSaved] = useState(getSavedSettings);
  const [draft, setDraft] = useState(saved);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const languageRowRef = useRef<HTMLAnchorElement>(null);
  const keyboardRowRef = useRef<HTMLAnchorElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const previousView = useRef<View>(view);

  // Back from a detail view: put focus on the row that opened it.
  useEffect(() => {
    if (view === "main" && previousView.current !== "main") {
      (previousView.current === "language" ? languageRowRef : keyboardRowRef).current?.focus();
    }
    previousView.current = view;
  }, [view]);

  useEffect(() => {
    if (saveState === "error") errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [saveState]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const dirty = isDirty(draft, saved);
  const saving = saveState === "saving";

  const save = () => {
    const payload = draft;
    setSaveState("saving");
    saveSettings(payload).then(
      () => {
        setSaved(payload);
        setSaveState("idle");
        dispatchToast(<Toast><ToastTitle>Settings saved</ToastTitle></Toast>, { intent: "success" });
      },
      () => setSaveState("error"),
    );
  };

  const discard = () => {
    setDraft(saved);
    setSaveState("idle");
  };

  if (view === "language") {
    return <DetailView title="Language" description="Choose the language of the app. Your choice applies once you save your changes." choices={LANGUAGES} value={draft.language} onChange={(id) => update("language", id)} />;
  }
  if (view === "keyboard") {
    return <DetailView title="Keyboard layout" description="Choose the layout of your keyboard. Your choice applies once you save your changes." choices={KEYBOARD_LAYOUTS} value={draft.keyboardLayout} onChange={(id) => update("keyboardLayout", id)} />;
  }

  const buttonSize = narrow ? "large" : "medium"; // 40px targets on touch layouts

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        {saveState === "error" && (
          <MessageBar ref={errorRef} intent="error" layout="multiline" className={styles.error}>
            <MessageBarBody>
              <MessageBarTitle>Saving failed</MessageBarTitle>
              Your changes are not saved. Check your connection and try again.
            </MessageBarBody>
            <MessageBarActions containerAction={<Button appearance="transparent" aria-label="Dismiss" icon={<Dismiss20Regular />} onClick={() => setSaveState("idle")} />}>
              <Button onClick={save}>Try again</Button>
            </MessageBarActions>
          </MessageBar>
        )}

        <header className={styles.header}>
          <Text as="h1" size={500} weight="semibold" className={styles.title}>Settings</Text>
          <Text className={styles.description}>Choose how you are notified and how the app starts.</Text>
        </header>

        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (dirty && !saving) save();
          }}
        >
          <Section title="Language and keyboard" description="The language of the app and the layout of your keyboard.">
            <NavRow view="language" label="Language" value={labelOf(LANGUAGES, draft.language)} linkRef={languageRowRef} />
            <NavRow view="keyboard" label="Keyboard layout" value={labelOf(KEYBOARD_LAYOUTS, draft.keyboardLayout)} linkRef={keyboardRowRef} />
          </Section>

          <Section title="Notifications" description="Choose where you receive notifications.">
            <SwitchRow label="Desktop notifications" checked={draft.desktop} onChange={(value) => update("desktop", value)} />
            <SwitchRow label="Email notifications" checked={draft.email} onChange={(value) => update("email", value)} />
            <SwitchRow label="Text message notifications" checked={draft.sms} onChange={(value) => update("sms", value)} />
          </Section>

          <Section title="Startup and performance" description="Control how the app starts and runs.">
            <CheckboxRow label="Start automatically" checked={draft.autoStart} onChange={(value) => update("autoStart", value)} />
            <CheckboxRow label="Open in the background" checked={draft.openInBackground} onChange={(value) => update("openInBackground", value)} />
            <CheckboxRow label="Turn off GPU acceleration" checked={draft.disableGpu} onChange={(value) => update("disableGpu", value)} />
          </Section>

          <div className={styles.footer}>
            <Button type="button" size={buttonSize} className={styles.footerButton} disabled={!dirty || saving} onClick={discard}>Discard changes</Button>
            <Button type="submit" appearance="primary" size={buttonSize} className={styles.footerButton} disabled={!dirty} disabledFocusable={saving} icon={saving ? <Spinner size="tiny" /> : undefined}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
      <Toaster toasterId={toasterId} />
    </main>
  );
}
