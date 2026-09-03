# Changelog

## [1.6.0](https://github.com/tanay-787/refind/compare/refind-v1.5.0...refind-v1.6.0) (2026-09-03)


### Features

* **results:** indeterminate progress and scanning copy during initial discovery ([6e96680](https://github.com/tanay-787/refind/commit/6e96680c63db69c48fe4072e09e1019adf7909a5))

## [1.5.0](https://github.com/tanay-787/refind/compare/refind-v1.4.2...refind-v1.5.0) (2026-09-01)


### Features

* **search:** query-derived suggestion chips ([03fdc48](https://github.com/tanay-787/refind/commit/03fdc48faea7b3ca981c18070784c23dfd4aee64))


### Bug Fixes

* **search:** sanitize FTS5 query tokens and separate query execution ([eea8e9a](https://github.com/tanay-787/refind/commit/eea8e9a9dab64d7ac810340af93fce4d4509ae26))
* **sync:** show syncing state during initial ingest to prevent Welcome hang ([c40095f](https://github.com/tanay-787/refind/commit/c40095f678948f42a50c414b3aba04cb8a87ff3b))

## [1.4.2](https://github.com/tanay-787/refind/compare/refind-v1.4.1...refind-v1.4.2) (2026-08-30)


### Bug Fixes

* **ci:** use Node 24 in release workflow build job ([#17](https://github.com/tanay-787/refind/issues/17)) ([1fb7594](https://github.com/tanay-787/refind/commit/1fb7594fd536124a5c45337841d3aabef7eb5199))

## [1.4.1](https://github.com/tanay-787/refind/compare/refind-v1.4.0...refind-v1.4.1) (2026-08-30)


### Bug Fixes

* **ci:** pin EAS CLI to Node 20-compatible version ([#15](https://github.com/tanay-787/refind/issues/15)) ([f08fed9](https://github.com/tanay-787/refind/commit/f08fed9cb0f541a8042d466ce5f00fbc6c258c94))

## [1.4.0](https://github.com/tanay-787/refind/compare/refind-v1.3.2...refind-v1.4.0) (2026-08-20)


### Features

* **home:** semantic live status text and 300ms delayed search spinner ([4be6676](https://github.com/tanay-787/refind/commit/4be6676415676d328bd233582da53381c8f263ec))
* **onboarding:** outcome-focused copy on grant permission screen ([1fa6c17](https://github.com/tanay-787/refind/commit/1fa6c17b5d65162bcbd45be19fc3cac558dd6d7b))
* **results:** polished idle, welcome, and no-results states ([58b89cf](https://github.com/tanay-787/refind/commit/58b89cfa952762a201686b81718ca56b8195c5c3))


### Bug Fixes

* **permission:** unconditional onboarding nav and discriminated return type ([5cfd9df](https://github.com/tanay-787/refind/commit/5cfd9dff35df725fc26d6f3179706da17a2be1b2))

## [1.3.2](https://github.com/tanay-787/refind/compare/refind-v1.3.1...refind-v1.3.2) (2026-08-13)


### Bug Fixes

* **viewer:** prevent image and scrim from disapearring on resume ([9bd388d](https://github.com/tanay-787/refind/commit/9bd388d3f0f3c9b22fdcc76296a81fa0ea519aa1))

## [1.3.1](https://github.com/tanay-787/refind/compare/refind-v1.3.0...refind-v1.3.1) (2026-08-05)


### Bug Fixes

* **viewer:** prevent accidental swipe dismiss and worklet argument drops ([b413c2a](https://github.com/tanay-787/refind/commit/b413c2a49259c678c10a6552e4d2e9ddbbef11c5))
* **viewer:** resolve native view loss and navigation freezes on returning from background ([82d9e02](https://github.com/tanay-787/refind/commit/82d9e02879632974a3360f03c3c8497a478cbfee))

## [1.3.0](https://github.com/tanay-787/refind/compare/refind-v1.2.1...refind-v1.3.0) (2026-08-04)


### Features

* **onboarding:** enforced `dark` colorScheme ([bcdad07](https://github.com/tanay-787/refind/commit/bcdad0715d9cac39d1cbbbb55eab74c563c8b8e5))
* **system-bars:** utilize `SystemBars` for handling StatusBar and NavBar behaviour ([180e98d](https://github.com/tanay-787/refind/commit/180e98d4411a73f0f477688d3c2ab8c672030b06))
* **theme:** expose `colorScheme` with proper type-safety ([92e6a13](https://github.com/tanay-787/refind/commit/92e6a13518955ddfafdf915fe7654f3ee78c3864))
* **viewer:** add Sharing logic ([0a85ca8](https://github.com/tanay-787/refind/commit/0a85ca87219674625e311c631176d1bfed2fe757))


### Bug Fixes

* **engine:** import `deleteAsync()` from legacy path ([5f0ba9d](https://github.com/tanay-787/refind/commit/5f0ba9d617ab4e3f3ac77d54832f05c7865d93b1))
* **onboarding:** update `handleContinue` to track navigation before toggling `loading` state ([8fd989b](https://github.com/tanay-787/refind/commit/8fd989ba0f7b6cfc253e7d13aeaecf0c0f501a22))


### Performance Improvements

* **engine:** remove manual engine throttling when AppState = 'background' ([76fa1d0](https://github.com/tanay-787/refind/commit/76fa1d044726564aeeac22b188542b6929fbe6f0))
* **viewer:** optimize animations and scheduling ([41f9b52](https://github.com/tanay-787/refind/commit/41f9b5220b30bdd0702b86c9d27a48c0464b5517))

## [1.2.1](https://github.com/tanay-787/refind/compare/refind-v1.2.0...refind-v1.2.1) (2026-07-28)


### Bug Fixes

* **assets:** resize based on Android's adaptive icons guidelines ([1dd6a3c](https://github.com/tanay-787/refind/commit/1dd6a3c20b4d58d6763fac791d0fdd8565dc1270))

## [1.2.0](https://github.com/tanay-787/refind/compare/refind-v1.1.3...refind-v1.2.0) (2026-07-27)


### Features

* **assets:** update Android product assets and remove legacy placeholders ([50ed5fc](https://github.com/tanay-787/refind/commit/50ed5fcf2f1560e238ffa4a803c02aa90355f084))
* **stages:** shifted the metadata phase to `intake` phase ([7adc51b](https://github.com/tanay-787/refind/commit/7adc51b56e2656c94102bbafc3304c3a1596073d))


### Bug Fixes

* **engine:** switch stage execution to depth-first to complete jobs quickly ([33b74a5](https://github.com/tanay-787/refind/commit/33b74a537804057b501778dd6fdb0b8106fc1bb4))
* **home:** memoize `useLiveQuery()` inputs to eliminate 30-40s hang on mount ([a8c3048](https://github.com/tanay-787/refind/commit/a8c304851b448526fd5d3d3d660fe08bfaeeea63))
* initialize the Notification Channel in a Fire and Forget manner to avoid blocking ([e6e0abc](https://github.com/tanay-787/refind/commit/e6e0abc347b76a7cca34fa24cfdefb527fa9419a))
* **notifications:** shift channel initialization to app startup to avoid blocking native thread ([e5aa83d](https://github.com/tanay-787/refind/commit/e5aa83dd47c18c00303726d079d6afe004a9446d))
* removed a problematic `Keyboard.dismiss()` ([c65edd9](https://github.com/tanay-787/refind/commit/c65edd9011b3556ad10d57f92a59478210830769))
* resolve `recognizeText()` related type errors ([8d8b55a](https://github.com/tanay-787/refind/commit/8d8b55a685835744e7a361c4957b872eb5188bc8))
* **ui:** use live query for Recent Activity Feed in IdleState ([be5ebe3](https://github.com/tanay-787/refind/commit/be5ebe3ccd29fe0270522da04c7ebbaffee84d6c))


### Performance Improvements

* **executor:** add job-targeted stage claim function ([460a530](https://github.com/tanay-787/refind/commit/460a530e05f4ba4cd0a22d79333d465bc0a2d692))
* **intake:** replace O(N2) loop with a O(1) Hash Map ([89a8d0f](https://github.com/tanay-787/refind/commit/89a8d0f05c6e027180267919f7abf00a4eb588b8))
* **ocr:** dynamically resolve and cache the `recognizeText()` ([c536eb4](https://github.com/tanay-787/refind/commit/c536eb4ac53f4a1f5254ee78b5a6eb90d693420f))
* **ocr:** skip redundant global pass for landscape images ([82fdb8a](https://github.com/tanay-787/refind/commit/82fdb8abe9c0703a49825d5ef1a9e775c9af38ce))
* **runner:** add stage-fused job execution ([ff691e6](https://github.com/tanay-787/refind/commit/ff691e6118ff448524a33e712e5dc15767ec7f36))
* **runner:** remove per-stage recoveryExpiredLeases call ([371aa18](https://github.com/tanay-787/refind/commit/371aa18d1222767e391a7f4a892fbd5fafd57713))
* **stages:** optimize keyword and FTS index writes ([deac8c0](https://github.com/tanay-787/refind/commit/deac8c096130c198d4acbe5a3b6db60d207a47f9))

## [1.1.3](https://github.com/tanay-787/refind/compare/refind-v1.1.2...refind-v1.1.3) (2026-07-19)


### Bug Fixes

* add missing `babel-preset-expo` module ([5a69f51](https://github.com/tanay-787/refind/commit/5a69f5173e19159479e9c8ab90bb5f95bbf4b05b))

## [1.1.2](https://github.com/tanay-787/refind/compare/refind-v1.1.1...refind-v1.1.2) (2026-07-19)


### Bug Fixes

* move pnpm overrides to workspace config ([b4c7f16](https://github.com/tanay-787/refind/commit/b4c7f160083f80ae86091f98dea64209ba2d33a3))

## [1.1.1](https://github.com/tanay-787/refind/compare/refind-v1.1.0...refind-v1.1.1) (2026-07-19)


### Bug Fixes

* pin pnpm version in release-please Android build workflow ([56e6539](https://github.com/tanay-787/refind/commit/56e6539f436fc75cec71a799e0f97ebc6b752837))

## [1.1.0](https://github.com/tanay-787/refind/compare/refind-v1.0.0...refind-v1.1.0) (2026-07-19)


### Features

* **assets:** migrated illustrations to use consistent brand colors ([ad27d98](https://github.com/tanay-787/refind/commit/ad27d98923156cebbaab1feca709a86e012beabf))
* **core:** add retry functionality for failed job executions ([5da3705](https://github.com/tanay-787/refind/commit/5da37055abd16699ca0c48e6cc0b2f69ef03fafe))
* **core:** display a persistent notification when background processing starts ([10a1afb](https://github.com/tanay-787/refind/commit/10a1afb1ce4b3d8e5329fd739be817cfbf191bf1))
* **deps:** add `react-native-notify-kit` ([2d73451](https://github.com/tanay-787/refind/commit/2d7345172aa56b3e982de583fdc0431d8537963c))
* **docs:** add core product story behind 'Refind' ([ee8efee](https://github.com/tanay-787/refind/commit/ee8efeef065883b0571f8be754768f9bf2438fec))
* **home:** implement a new default state ([4e07aa2](https://github.com/tanay-787/refind/commit/4e07aa29e2232e0c6c5801cf76c4f1c05ad90201))
* **home:** introduce IdleDashboard and refine WelcomeState textual content ([f66aaa4](https://github.com/tanay-787/refind/commit/f66aaa4c24336d0d2ee0d034194d1596449fc46f))
* **hooks:** add `zustand` for a better state machine ([68373ce](https://github.com/tanay-787/refind/commit/68373ce1ab321155adf4738eaa0b2c98f3d9af2f))
* **library:** implement Material 3 status dashboard and live peek ([be4e483](https://github.com/tanay-787/refind/commit/be4e48315406cdb8832f0a9973c29ae6f98c3a78))
* **library:** migrate from FlatList to Shopify's FlashList for rendering screenshots ([0bf6282](https://github.com/tanay-787/refind/commit/0bf62820bc3dd9b54eb32347065e7e3a8b2156dc))
* **library:** support paginated loading of all available screenshots ([1f4412f](https://github.com/tanay-787/refind/commit/1f4412fe0fa7ecc136d0c3e1db4dbe2ddcbd3c46))
* **onboarding:** add centralize Permissions Management ([8cf6f1e](https://github.com/tanay-787/refind/commit/8cf6f1ed180020425b2e4a363d2afcd90ed6c39f))
* **permissions:** add native Snackbar warning for denied/limited permission states ([0a4980c](https://github.com/tanay-787/refind/commit/0a4980cdbb65eb9f10e7f06f2015132d58a61536))
* **permissions:** enhance architecture and contextual prompting ([95650e4](https://github.com/tanay-787/refind/commit/95650e4dd17b395e6ad1de1a96ff5365e5443825))
* renamed to 'Refind' ([7fa68fd](https://github.com/tanay-787/refind/commit/7fa68fdeb102dc3a37b0828abdfb5a4f96602d49))
* **search:** cap live search results to 12 top matches for better UX ([8af3f7f](https://github.com/tanay-787/refind/commit/8af3f7f915de69cf34137c96ad54154dfa6a0b03))
* **theme:** migrate to native Jetpack Compose theming via expo/ui's Host and Surface ([b2967f0](https://github.com/tanay-787/refind/commit/b2967f060d0bbbae5fb7992e79df86135feeb098))
* **typography:** add fonts and use them across the app ([f12a458](https://github.com/tanay-787/refind/commit/f12a458090344185c531b9ed47f618248e1e64c6))
* **ui:** add footer to Screenshot List ([817a2f7](https://github.com/tanay-787/refind/commit/817a2f7c6ea316a162219801a14d9368e14d7965))
* **ui:** add new onboarding setup ([ef845e6](https://github.com/tanay-787/refind/commit/ef845e60ed5a828d2c3ac8bb739bf6fb2a64a27c))
* **ui:** add reusable IconView ([39631a0](https://github.com/tanay-787/refind/commit/39631a09dbc77b31e1406467e5c4b7b9e16507b6))
* **ui:** immersive ImageViewer with FlashList migration and gallery-like gesture physics ([921a3e3](https://github.com/tanay-787/refind/commit/921a3e34c103bbfd159e678384ef7c7793fca03e))
* **ui:** implement dynamic masonry layout with aspect-ratio row chunking ([9cf223b](https://github.com/tanay-787/refind/commit/9cf223b35a40ba1136cb244da0060e551306477f))
* **ui:** introduce `LiveStatusTracker` in the Header ([c47d7e4](https://github.com/tanay-787/refind/commit/c47d7e41f51a75354dc6ef61d91560fe365acecc))
* **ui:** redesign home ui ([ccde8f2](https://github.com/tanay-787/refind/commit/ccde8f20d88d7d7ef97b82207b44b56ab41909b2))
* **viewer:** implement Google Lens inspired ondemand OCR extraction ([4865c6d](https://github.com/tanay-787/refind/commit/4865c6d01f80878795382bbba7d333e6812447fe))


### Bug Fixes

* asset path ([b419786](https://github.com/tanay-787/refind/commit/b419786fc02570a0c7603fd8e6c2a1fab8b7dbaf))
* **core:** count job-level statuses instead of stage executions ([99ea445](https://github.com/tanay-787/refind/commit/99ea4454ce08f5c0483dbb6c8058c0c62c94e2f8))
* **notifications:** swallow SecurityException when permission denied ([4be47f5](https://github.com/tanay-787/refind/commit/4be47f51d70ac62368a5180a51646af2de36faeb))
* **permissions:** re-evaluate permission status on app foreground ([a0c1be8](https://github.com/tanay-787/refind/commit/a0c1be860839d6ae2eb6a008534cbd76dae69295))
* **ui:** eliminate visual flash during onboarding image load ([a3af932](https://github.com/tanay-787/refind/commit/a3af9325dcf879fe16b7dc0fc778d17bc856370a))


### Performance Improvements

* **core:** batch insert keyword results in keywords stage ([9d8eea9](https://github.com/tanay-787/refind/commit/9d8eea972a415c12c14c2f829e2278a80a425b6d))
* **core:** optimize screenshot intake for bulk workload ([67d9aa0](https://github.com/tanay-787/refind/commit/67d9aa034f0fac05354ca58564803880096e8630))
* **job-journal:** decouple high-frequency stats from global context ([6c783e9](https://github.com/tanay-787/refind/commit/6c783e9212aef51991a54a1e19868cd41b063d8a))
* **job-journal:** replace interval polling with Drizzle live queries ([cfd1244](https://github.com/tanay-787/refind/commit/cfd12445387d0f34fe04f703bb12f846d8c3a745))
* **jobjournal:** use time-budget instead of strict iteration limit for background tasks ([88c82c5](https://github.com/tanay-787/refind/commit/88c82c597c2d380cd320f0be822eed451625d182))
* **library:** optimize stage execution left join and increase limit ([1608451](https://github.com/tanay-787/refind/commit/160845143f20f14b0809eb281eab07d912f4f1f4))
* **notifications:** simplify and optimize background notifications ([ea2a31c](https://github.com/tanay-787/refind/commit/ea2a31cfdde24d50dea5b1ec8beb5f68abf1b9f8))
* **ui:** migrate ListItems to pure RN components ([49a7c80](https://github.com/tanay-787/refind/commit/49a7c80a9c6e2c4ff55661a963aff0463919012e))
* **ui:** optimize home screen rendering and resolve icon flicker ([afd2267](https://github.com/tanay-787/refind/commit/afd2267be8b52f6aad5b2583dd8fd199921e2a78))
* **ui:** optimize rendering of screenshots ([e16941f](https://github.com/tanay-787/refind/commit/e16941fa540bfad430772d1a312bbb928e5abbe0))
* **ui:** optimize UI to use expo/ui best practices ([88112a5](https://github.com/tanay-787/refind/commit/88112a554f026b141882aadf4469002d843cb5ee))
