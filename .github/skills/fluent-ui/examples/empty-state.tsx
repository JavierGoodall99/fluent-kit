// Empty state and first-run welcome. Use it the first time someone opens an app with no data, for an empty list or search,
// for an error page and for a success message. Never show a blank page.
// Measurements follow Microsoft's "Empty State Template (Web Large)" in the Microsoft 365 UI Kit:
//   centred in the available space, 20px between the image, text and actions, title 16px bold, text 14px (max about 600px),
//   actions in a column about 280px wide: primary, secondary, then a link as the tertiary action; 8px between actions.
// The kit uses one large Fluent icon instead of an illustration. One primary action is enough; secondary and tertiary are optional.
// UI text is English. Use the project's language and wording.
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
        <Text as="h2" size={400} weight="bold" align="center" className={s.title}>{title}</Text>
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
