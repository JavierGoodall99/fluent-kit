// Empty state and first-run skeleton: icon, title, text, a 280px column of actions. Rules and measurements: patterns/feedback.md.
// UI text: use the project's language.
import { Button, Link, Text, makeStyles, tokens } from "@fluentui/react-components";
import { DocumentAdd48Regular } from "@fluentui/react-icons";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  wrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: tokens.spacingVerticalXL, minHeight: "320px", padding: tokens.spacingHorizontalXL, textAlign: "center" },
  icon: { color: tokens.colorBrandForeground1 },
  title: { margin: 0 },
  link: { textAlign: "center" },
  text: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS, maxWidth: "600px" },
  actions: { display: "flex", flexDirection: "column", alignItems: "stretch", rowGap: tokens.spacingVerticalS, width: "100%", maxWidth: "280px" },
});

export function EmptyState({ icon = <DocumentAdd48Regular />, title, description, primary, secondary, tertiary }: {
  icon?: ReactNode;
  title: string;
  description: string;
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  tertiary?: { label: string; href: string };
}) {
  const s = useStyles();
  return (
    <div className={s.wrap} role="status">
      <span className={s.icon} aria-hidden="true">{icon}</span>
      <div className={s.text}>
        <Text as="h2" size={400} weight="semibold" align="center" className={s.title}>{title}</Text>
        <Text align="center">{description}</Text>
      </div>
      <div className={s.actions}>
        <Button appearance="primary" onClick={primary.onClick}>{primary.label}</Button>
        {secondary && <Button onClick={secondary.onClick}>{secondary.label}</Button>}
        {tertiary && <div className={s.link}><Link href={tertiary.href}>{tertiary.label}</Link></div>}
      </div>
    </div>
  );
}
