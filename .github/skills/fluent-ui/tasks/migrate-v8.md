# Migrate an app from Fluent v8 to v9

The person asked to move to v9. v8 and v9 run side by side, so migrate screen by screen; the app keeps working between steps.

**Once, at the start** (skip what is done):
1. `node .fluent-kit/scripts/context.mjs new-app`. Brand: the v8 theme's `themePrimary` is the brand; name it.
2. `node .fluent-kit/scripts/check.mjs --baseline`: today's v8 imports are tolerated, new ones fail.
3. Install `@fluentui/react-components @fluentui/react-icons` next to `@fluentui/react`; `make-theme.mjs <themePrimary> --out src/theme.tsx`.
4. Wrap the root in `AppProvider` **outside** the v8 `ThemeProvider`; keep v8's provider and `initializeIcons` until the last v8 screen. Nothing should look different yet.

**Each screen** (the one the person names first; the app shell is its own step):
- Swap every v8 component in its files, keeping behaviour, data and order. Then follow its pattern card for layout.
- `mergeStyles`, `styles` props, `getTheme().palette`/`semanticColors` → `makeStyles` + `tokens` (`themePrimary` → `colorBrandBackground`, `neutralPrimary` → `colorNeutralForeground1`, `white` → `colorNeutralBackground1`).
- Done: no `@fluentui/react` import left in its files; delete those files' lines from `.fluent-kit/baseline.json`. Finish with `--page` for that screen.

| v8 | v9 |
|---|---|
| `DefaultButton`, `PrimaryButton`, `ActionButton`, `IconButton` | `Button` (`appearance="primary"`/`"subtle"`; icon-only: `icon` + `aria-label` + `Tooltip`) |
| `TextField` (multiline) | `Field` + `Input` (`Textarea`); `errorMessage` → `validationMessage` |
| `Dropdown`, `ComboBox` | `Field` + `Dropdown`/`Combobox` + `Option`; `selectedKey` → `selectedOptions`, `onChange` → `onOptionSelect` |
| `Toggle`, `ChoiceGroup`, `Checkbox` | `Switch`, `RadioGroup` + `Radio`, `Checkbox` |
| `DetailsList`, `Selection` | `DataGrid` (`patterns/list.md`) |
| `Panel` | `OverlayDrawer` (`patterns/drawer.md`) |
| `Dialog`, `Modal` | `Dialog` > `DialogSurface` > `DialogBody` (`DialogTitle`, `DialogContent`, `DialogActions`) |
| `MessageBar` | `MessageBar` + `MessageBarBody` |
| `Pivot`, `CommandBar`, `Nav` | `TabList` + `Tab`, `Toolbar`, `NavDrawer` (`patterns/nav.md`) |
| `ContextualMenu`, `Callout`, `TooltipHost` | `Menu`, `Popover`, `Tooltip` |
| `Stack` | a `div` with `makeStyles` flex and `tokens.spacing*` |
| `Text variant`, `Label`, `Link`, `Image` | `Text`/`Title3`/`Body1`, `Label`, `Link`, `Image` with `alt` |
| `Spinner`, `ProgressIndicator`, `Shimmer`, `Separator` | `Spinner`, `ProgressBar`, `Skeleton`, `Divider` |
| `DatePicker` | `DatePicker` (`@fluentui/react-datepicker-compat`) |
| `Icon iconName="Add"` | `<AddRegular />` from `@fluentui/react-icons` |
| `FocusZone`, `Layer` | `useArrowNavigationGroup`, `Portal` |

No v9 equivalent: keep the v8 component, mark it `// fluent-kit-ignore -- no v9 equivalent yet`, list it.

**Last**: no `@fluentui/react` import anywhere: remove the v8 `ThemeProvider`, `initializeIcons` and the package; `--full`.

**Reply**: what moved, what is still v8 (screens and why), and the next screen to do.
