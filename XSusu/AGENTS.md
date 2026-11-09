# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Verification

```bash
npx tsc --noEmit                  # must exit 0
npx expo export --platform android --output-dir /tmp/check   # catches runtime import errors tsc misses
```

There is no lint or test script in this project.

The backend (`../XBack`) must also be clean:

```bash
cd ../XBack && npx tsc --noEmit && npm run build
```

Both repos are expected at **zero errors**. If you see implicit-`any` errors on
Prisma query results, the Prisma client is stale or version-mismatched — run
`npx prisma generate`, do not paper over it with type annotations.

## Native build required

This is a dev-client project, not Expo Go. It uses these native modules:
reanimated + worklets, gesture-handler, haptics, blur, linear-gradient, image,
flash-list, bottom-sheet, keyboard-controller, pager-view, async-storage, svg,
webview, secure-store, notifications, local-authentication, screen-capture.

After changing native dependencies you must rebuild:

```bash
eas build --profile development --platform android
```

## Design system

All UI goes through `src/theme/` and `src/components/ui/`. When writing screens:

- No hardcoded colours, font sizes or spacing — read from `useTheme()`.
- Use `<Text>` from `components/ui`, never `Text` from react-native.
- Wrap screens in `<Screen>`, which handles safe-area insets and the status bar.
- Use `toast` / `ConfirmSheet` instead of `Alert.alert`.
- `Button` applies `style` to its inner view; for `flex` layouts wrap it in a
  `<View style={{flex:1}}>` and pass `fullWidth`.
- Reanimated only (no `Animated` from react-native), and set
  `reduceMotion: ReduceMotion.System` via the presets in `theme/animations.ts`.

## Prisma (backend)

`prisma` and `@prisma/client` are pinned to the **same exact** version (6.19.3).
Keep them in lockstep and pinned — a CLI/client mismatch makes every query result
type as `any`, which silently disables type checking across the services.

Do **not** use `@latest` here: npm's `latest` dist-tag for `prisma` currently
points at an `8.0.0-rc` pre-release with a rewritten CLI (no `validate` command)
and a breaking schema change — v7+ removes `url` from the `datasource` block and
requires `prisma.config.ts` plus a driver adapter. Moving to 7 or 8 is a real
migration, not a version bump.

After changing the schema, run `npx prisma generate`.

Note: `group.service.ts` types `getUserGroups` via a hand-written
`UserGroupMembership` interface whose `group` field is `object`, which discards
the group's real fields. It predates the version fix and could now be dropped in
favour of Prisma's inference.
