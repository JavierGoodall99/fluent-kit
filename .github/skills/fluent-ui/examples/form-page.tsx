// Form or settings page: one centred column, sections with a short header, inputs with labels above, actions at the bottom right.
// Measurements follow Microsoft's "Form Template" and "Settings Template" (Web Large) in the Microsoft 365 UI Kit:
//   column about 480px wide, 20px between blocks, 12px between fields in a section, title 16px bold, description 14px grey,
//   section header 12px bold, inputs with the filled look (filled-lighter on a tinted page, so the field is visible; filled-darker only on a white page), Discard (secondary) then Save (primary) at the bottom right.
// Rules: Fluent controls only (Dropdown, not a native select; DatePicker, not type="date"); validation next to the field;
// a settings page saves on change or has one Save; say what a switch does in its label, not "On/Off".
// UI text is English. Use the project's language and wording.
import {
  Button,
  Checkbox,
  Dropdown,
  Field,
  Input,
  Option,
  Radio,
  RadioGroup,
  Switch,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useState } from "react";

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100%", backgroundColor: tokens.colorNeutralBackground2, padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXL} 0` },
  column: { display: "flex", flexDirection: "column", width: "100%", maxWidth: "480px", flexGrow: 1, rowGap: tokens.spacingVerticalXL },
  header: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
  title: { margin: 0 },
  description: { color: tokens.colorNeutralForeground3 },
  section: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  sectionHeader: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: tokens.spacingHorizontalM, "@media (max-width: 640px)": { gridTemplateColumns: "1fr", rowGap: tokens.spacingVerticalM } },
  footer: { position: "sticky", bottom: 0, display: "flex", justifyContent: "flex-end", columnGap: tokens.spacingHorizontalS, padding: `${tokens.spacingVerticalM} 0 ${tokens.spacingVerticalXL}`, borderTop: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground2 },
});

export function FormPage() {
  const s = useStyles();
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const nameError = touched && name.trim() === "" ? "Enter a name." : undefined;
  return (
    <form className={s.page} onSubmit={(e) => { e.preventDefault(); setTouched(true); }} noValidate>
      <div className={s.column}>
        <div className={s.header}>
          <Text as="h1" size={400} weight="bold" className={s.title}>Project settings</Text>
          <Text className={s.description}>Changes apply to everyone who works on this project.</Text>
        </div>

        <section className={s.section} aria-labelledby="general">
          <div className={s.sectionHeader}>
            <Text id="general" size={200} weight="bold">General</Text>
            <Text className={s.description}>Name and ownership.</Text>
          </div>
          <div className={s.row}>
            <Field label="Project name" size="small" required validationMessage={nameError} validationState={nameError ? "error" : "none"}>
              <Input appearance="filled-lighter" value={name} onChange={(_, d) => setName(d.value)} onBlur={() => setTouched(true)} />
            </Field>
            <Field label="Team" size="small">
              <Dropdown appearance="filled-lighter" defaultValue="Platform" defaultSelectedOptions={["platform"]}>
                <Option value="platform">Platform</Option>
                <Option value="support">Support</Option>
              </Dropdown>
            </Field>
          </div>
        </section>

        <section className={s.section} aria-labelledby="notify">
          <div className={s.sectionHeader}>
            <Text id="notify" size={200} weight="bold">Notifications</Text>
            <Text className={s.description}>Choose how people hear about changes.</Text>
          </div>
          <Switch label="Send email notifications" defaultChecked />
          <Switch label="Send desktop notifications" />
          <Field label="Digest frequency" size="small">
            <RadioGroup defaultValue="daily">
              <Radio value="daily" label="Daily" />
              <Radio value="weekly" label="Weekly" />
            </RadioGroup>
          </Field>
          <Checkbox label="Include archived items in the digest" />
        </section>

        <div className={s.footer}>
          <Button type="reset" onClick={() => { setName(""); setTouched(false); }}>Discard</Button>
          <Button type="submit" appearance="primary">Save</Button>
        </div>
      </div>
    </form>
  );
}
