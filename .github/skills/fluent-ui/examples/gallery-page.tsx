// Gallery / home page: a page title, then sections. Each section has a title row ("See more" at the right) and a row of cards.
// Use when the requirement is "browse several groups of things at a glance" (recent files, templates, projects, media).
// Measurements follow Microsoft's "Media Gallery" and "Default" templates (Web Large) in the Microsoft 365 UI Kit:
//   page padding 20px, 20px between sections; page title 20px semibold, subtitle 14px;
//   section title row 32px high, title 16px semibold, "See more" link 14px at the right; 8px between the row and the cards;
//   cards in a row 12px apart and of equal width; card radius 8px (tokens.borderRadiusXLarge), padding 16px, gap 16px, shadow4.
// Rules: every card in a row has the same shape and height; the card title is the click target (a link), not the whole card with nested buttons;
// the section is a labelled group; cards share the row equally (auto-fit, no empty strip at the right) and wrap to fewer columns on narrow screens, never below about 220px.
// UI text is English. Use the project's language and wording.
import { Card, CardHeader, Link, Text, makeStyles, tokens } from "@fluentui/react-components";
import { DocumentRegular } from "@fluentui/react-icons";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXL, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, minHeight: "100%" },
  titles: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS, maxWidth: "600px" },
  title: { margin: 0 },
  subtitle: { color: tokens.colorNeutralForeground3 },
  section: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS, minWidth: 0 },
  sectionRow: { display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "32px", columnGap: tokens.spacingHorizontalS },
  sectionTitle: { margin: 0 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: tokens.spacingHorizontalM },
  card: { minWidth: 0, minHeight: "250px", rowGap: tokens.spacingVerticalL, padding: tokens.spacingHorizontalL, borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4 },
  preview: { flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground3, color: tokens.colorNeutralForeground3 },
  meta: { color: tokens.colorNeutralForeground3 },
});

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const s = useStyles();
  return (
    <div className={s.titles}>
      <Text as="h1" size={600} weight="semibold" className={s.title}>{title}</Text>
      {subtitle && <Text className={s.subtitle}>{subtitle}</Text>}
    </div>
  );
}

// One section title row for every section: title at the left, one optional link at the right.
export function Section({ title, seeMoreHref, children }: { title: string; seeMoreHref?: string; children: ReactNode }) {
  const s = useStyles();
  return (
    <section className={s.section} aria-label={title}>
      <div className={s.sectionRow}>
        <Text as="h2" size={400} weight="semibold" className={s.sectionTitle}>{title}</Text>
        {seeMoreHref && <Link href={seeMoreHref}>See more</Link>}
      </div>
      <div className={s.cards}>{children}</div>
    </section>
  );
}

export function GalleryCard({ title, meta, href, preview = <DocumentRegular fontSize={48} /> }: { title: string; meta: string; href: string; preview?: ReactNode }) {
  const s = useStyles();
  return (
    <Card className={s.card}>
      <div className={s.preview} aria-hidden="true">{preview}</div>
      <CardHeader
        header={<Link href={href} appearance="subtle"><Text weight="semibold">{title}</Text></Link>}
        description={<Text size={200} className={s.meta}>{meta}</Text>}
      />
    </Card>
  );
}

export function GalleryPage() {
  const s = useStyles();
  return (
    <div className={s.page}>
      <PageTitle title="Home" subtitle="Pick up where you left off." />
      <Section title="Recent" seeMoreHref="#recent">
        <GalleryCard title="Quarterly report" meta="Edited yesterday" href="#a" />
        <GalleryCard title="Launch plan" meta="Edited 3 days ago" href="#b" />
        <GalleryCard title="Budget 2027" meta="Edited last week" href="#c" />
        <GalleryCard title="Team handbook" meta="Edited last month" href="#d" />
      </Section>
      <Section title="Shared with you" seeMoreHref="#shared">
        <GalleryCard title="Design review" meta="Shared by Sam" href="#e" />
        <GalleryCard title="Customer interviews" meta="Shared by Priya" href="#f" />
        <GalleryCard title="Roadmap" meta="Shared by Alex" href="#g" />
        <GalleryCard title="Release notes" meta="Shared by Jo" href="#h" />
      </Section>
    </div>
  );
}
