// Settings page skeleton. Rules and measurements: patterns/settings.md.
// One Save for the page; rows are a draft until then. Replace saveSettings with the real request. UI text: use the project's language.
import {
  Button, Checkbox, MessageBar, MessageBarActions, MessageBarBody, MessageBarTitle, Spinner, Switch, Text,
  Toast, ToastTitle, Toaster, makeStyles, mergeClasses, tokens, useId, useToastController,
} from "@fluentui/react-components";
import { ChevronRight20Regular, Dismiss20Regular } from "@fluentui/react-icons";
import { useState, type ReactNode } from "react";

interface Settings { language: string; email: boolean; desktop: boolean; autoStart: boolean }
const LANGUAGES: Record<string, string> = { en: "English", nl: "Nederlands" };
const saveSettings = (_: Settings) => new Promise<void>((resolve) => setTimeout(resolve, 600));

const useStyles = makeStyles({
  page: {
    display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground2, padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL} 0`,
    "@media (min-width: 640px)": { padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL} 0` },
  },
  column: { display: "flex", flexDirection: "column", flexGrow: 1, width: "100%", maxWidth: "480px", rowGap: tokens.spacingVerticalXL },
  stack: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
  section: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  title: { margin: 0 },
  muted: { color: tokens.colorNeutralForeground3 },
  group: {
    display: "flex", flexDirection: "column", overflowX: "hidden", backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4,
  },
  row: {
    display: "flex", alignItems: "center", boxSizing: "border-box", width: "100%", minHeight: "48px",
    padding: `0 ${tokens.spacingHorizontalM}`, borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    ":last-child": { borderBottom: "none" },
  },
  rowLabel: { flexGrow: 1, paddingLeft: 0 },
  indicator: { alignSelf: "center" },
  navRow: { justifyContent: "flex-start", columnGap: tokens.spacingHorizontalS, fontWeight: tokens.fontWeightRegular, maxWidth: "none" },
  footer: {
    position: "sticky", bottom: 0, marginTop: "auto", display: "flex", flexDirection: "column-reverse", rowGap: tokens.spacingVerticalM,
    padding: `${tokens.spacingVerticalM} 0 ${tokens.spacingVerticalL}`, borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    "@media (min-width: 640px)": { flexDirection: "row", justifyContent: "flex-end", columnGap: tokens.spacingHorizontalS },
  },
  footerButton: { width: "100%", "@media (min-width: 640px)": { width: "auto" } },
});

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const s = useStyles();
  const id = useId("section");
  return (
    <section className={s.section} aria-labelledby={id}>
      <div className={s.stack}>
        <Text as="h2" id={id} size={300} weight="semibold" className={s.title}>{title}</Text>
        <Text className={s.muted}>{description}</Text>
      </div>
      <div role="group" aria-labelledby={id} className={s.group}>{children}</div>
    </section>
  );
}

export function SettingsPage({ initial }: { initial: Settings }) {
  const s = useStyles();
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const dirty = (Object.keys(draft) as (keyof Settings)[]).some((k) => draft[k] !== saved[k]);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    setState("saving");
    saveSettings(draft).then(
      () => { setSaved(draft); setState("idle"); dispatchToast(<Toast><ToastTitle>Settings saved</ToastTitle></Toast>, { intent: "success" }); },
      () => setState("error"),
    );
  };

  return (
    <main className={s.page}>
      <form className={s.column} noValidate onSubmit={(e) => { e.preventDefault(); if (dirty && state !== "saving") save(); }}>
        {state === "error" && (
          <MessageBar intent="error" layout="multiline">
            <MessageBarBody><MessageBarTitle>Saving failed</MessageBarTitle>Your changes are kept. Check your connection and try again.</MessageBarBody>
            <MessageBarActions containerAction={<Button appearance="transparent" aria-label="Dismiss" icon={<Dismiss20Regular />} onClick={() => setState("idle")} />}>
              <Button onClick={save}>Try again</Button>
            </MessageBarActions>
          </MessageBar>
        )}
        <header className={s.stack}>
          <Text as="h1" size={600} weight="semibold" className={s.title}>Settings</Text>
          <Text className={s.muted}>Choose how you are notified and how the app starts.</Text>
        </header>

        <Section title="Language" description="The language of the app.">
          {/* Value + chevron opens a detail view with a RadioGroup; make it a real route so Back works. */}
          <Button as="a" href="#settings/language" appearance="subtle" iconPosition="after" icon={<ChevronRight20Regular />} className={mergeClasses(s.row, s.navRow)}>
            <span className={s.rowLabel}>Language</span>
            <span className={s.muted}>{LANGUAGES[draft.language]}</span>
          </Button>
        </Section>

        <Section title="Notifications" description="Where you receive notifications.">
          <Switch className={s.row} labelPosition="before" label={{ children: "Email notifications", className: s.rowLabel }} checked={draft.email} onChange={(_, d) => set("email", d.checked)} />
          <Switch className={s.row} labelPosition="before" label={{ children: "Desktop notifications", className: s.rowLabel }} checked={draft.desktop} onChange={(_, d) => set("desktop", d.checked)} />
        </Section>

        <Section title="Startup" description="How the app starts.">
          <Checkbox className={s.row} indicator={{ className: s.indicator }} label={{ children: "Start automatically", className: s.rowLabel }} checked={draft.autoStart} onChange={(_, d) => set("autoStart", d.checked === true)} />
        </Section>

        <div className={s.footer}>
          <Button type="button" className={s.footerButton} disabled={!dirty || state === "saving"} onClick={() => { setDraft(saved); setState("idle"); }}>Discard changes</Button>
          <Button type="submit" appearance="primary" className={s.footerButton} disabled={!dirty} disabledFocusable={state === "saving"} icon={state === "saving" ? <Spinner size="tiny" /> : undefined}>
            {state === "saving" ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
      <Toaster toasterId={toasterId} />
    </main>
  );
}
