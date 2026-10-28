// Gallery / home skeleton: page title, then sections of equal cards with a "See more" link. Rules and measurements: patterns/dashboard.md.
// UI text: use the project's language.
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
