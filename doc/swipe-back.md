# Back, forward and the swipe back of Safari

The page scrolls in the window, so the toolbar of Safari on a phone shrinks while a post is read. That makes the back and forward of a single-page app hard to get right, above all the swipe back of Safari on an iPhone. This file says what Safari does, what the app does about it and why, how to measure it, and what was tried before. The rules in short are in "Scroll and the swipe back" in [`code-convention.md`](code-convention.md); the code is `src/common/util/browser-history.ts`.

The facts about Safari below come from the source of WebKit (links at the end), read on 26 Nov 2026, and from its own log of real swipes in the iOS Simulator.

## What Safari does

### The back button

Safari goes back at once: it fires `popstate`, the app draws the screen of the entry, and Safari restores the scroll. What is on the screen is always the live page, with no picture in between. A small delay in drawing only shows the page left a little longer.

### The swipe back

The gesture starts before anything goes back, so Safari shows a picture of the entry under the finger: its snapshot. Three steps decide what the swipe looks like.

#### 1. When Safari takes the snapshot

Safari takes the snapshot of an entry when a new entry is added after it (`WebBackForwardList::addItem` calls `recordAutomaticNavigationSnapshot`), so for this app at the `pushState` of a move. It is a picture of what is on the screen at that moment, kept with the scroll of the window, the size of the view and the size of the page then (its render tree size).

So a `pushState` that runs after the new screen is drawn takes a snapshot of the wrong screen, and saves the wrong scroll for the entry left.

#### 2. When Safari shows the snapshot

During the swipe, Safari draws the snapshot only when all of these hold (`ViewGestureController::beginSwipeGesture` in `ViewGestureControllerIOS.mm`):

1. It has a picture, at the size and scale of the view now.
2. The entry has its scroll restored by the browser (`history.scrollRestoration` is `auto`), or the window is at the same scroll as when the picture was taken.
3. The insets of the view (the toolbar, the safe area) have not changed by 100 points or more.

Otherwise it draws the background color of the page, and the swipe shows a blank page under the finger.

#### 3. When Safari removes the snapshot

When the finger lets go, the back happens (`popstate`), and the snapshot stays over the page until Safari sees that the page is ready. For a back within the same document (this app), it waits for these events (`SnapshotRemovalTracker` in `ViewGestureController.cpp`):

1. `RenderTreeSizeThreshold`: the page is at least half as big as when the snapshot was taken.
2. `RepaintAfterNavigation`: the first frame drawn after the back.
3. `ScrollPositionRestoration`: the first frame after Safari applied its scroll restoration. Safari applies it in the frame it commits, bounded to the height of the page in that frame, so a restoration onto a page that is still too short comes out clamped. In the WebKit of today this event comes with `manual` too; reports of freezes of seconds with `manual` (scroll-behavior issue 128) are from an older WebKit.
4. `SubresourceLoads`: nothing of the page is still loading (checked every 250 ms).

A watchdog removes it anyway after 3 seconds. It is never removed before the animation of the swipe has ended. While the snapshot is up, a touch does not reach the page, so the page does not scroll.

So the time a snapshot stays after the swipe is short when the first frame after the back is already the finished screen at its scroll, and up to 3 seconds when one event is late. Which post the swipe starts from changes it too: a long post can pass the size test before the list is drawn, a short one cannot.

## What the app does

Every move says where its screen is drawn (`Model.scroll`): a link move at the top, the back and forward at the scroll saved in their entry. Each entry keeps the scroll it was left at in its state (`{ scrollY }`). `useScrollOf` in `src/view.tsx` scrolls there in a layout effect, after React has drawn the screen and before the browser paints it. This part comes from TEA Ecosystem (its commit `310fd94`).

On top of it, three rules make the first frame after a back the finished screen at its scroll, so every event of step 3 comes at once, and the snapshot of step 1 is the right one:

1. The restoration of the browser stays `auto`, so step 2 shows the snapshot even when the window is at another scroll than the picture (a post at its top, a list scrolled down).
2. The back and forward are drawn in the `popstate` event itself (`popStateSub`, given to `Program` in `src/program.tsx`). The subscription of `ProgramWithNav` dispatches in a later task, so Safari restored the scroll on the screen being left and checked the size of the wrong page.
3. A link adds its history entry at the click (`pushEntryOfLink`, called by `Link` and by a link in the body of a post), before the move is dispatched and while the page is still at its scroll. So the snapshot is of the screen left, and the scroll saved with it is its own. The push of the step (`pushUrlCmd`) then finds the URL there already and adds nothing.

The scroll of the app and the one of the browser land on the same place: the app scrolls in `popstate`, and the browser restores the scroll it saved at the click, right after.

## How to measure it

### The log of WebKit

WebKit logs every step of the removal of the snapshot, with the time since the finger let go. In the iOS Simulator:

```bash
xcrun simctl spawn booted log stream --level debug --style compact --predicate 'category == "ViewGestures"'
```

On an iPhone: connect it to the Mac, open Console.app, pick the iPhone, start streaming and search for `Swipe Snapshot Removal`.

A good swipe back ends with every event in the same frame, right after the animation:

```
Swipe Snapshot Removal (0.00 ms) - start
Swipe Snapshot Removal (14.18 ms) - wait for event cancelled: MainFrameLoad
Swipe Snapshot Removal (14.20 ms) - outstanding event occurred: SubresourceLoads
Swipe Snapshot Removal (430.22 ms) - outstanding event occurred: RenderTreeSizeThreshold
Swipe Snapshot Removal (430.43 ms) - outstanding event occurred: ScrollPositionRestoration
Swipe Snapshot Removal (430.48 ms) - outstanding event occurred: RepaintAfterNavigation
Swipe Snapshot Removal (430.49 ms) - removing snapshot
```

A bad one shows `watchdog timer fired`, or events far apart; the line before it names the event Safari waited for.

### Blank frames

To see what the swipe looks like, record the screen of the Simulator (`xcrun simctl io booted recordVideo --codec=h264 swipe.mp4`), cut it into frames at 30 per second with `ffmpeg`, and count the frames that are near uniform (the standard deviation of a frame in gray below 0.03, with ImageMagick). A blank snapshot shows as a run of such frames. Open the site in the Simulator at `http://127.0.0.1:<port>`: Safari there hangs on `localhost`.

## What was tried

1. Before 26 Nov 2026, the browser restored the scroll alone, the app scrolled to the top after a move, and the URL was pushed after the move was drawn. A swipe back showed the snapshot, then a page that did not scroll for a moment, at a wrong scroll.
2. The port of TEA Ecosystem `310fd94` (`history.scrollRestoration = 'manual'`, the scroll of the app in a layout effect) fixed the back button, but the swipe showed a blank page under the finger (step 2: no restoration by the browser, and a window at another scroll) and a blank page for about 0.4 seconds after.
3. The page in its own scroll box, as TEA Ecosystem does (its commit `45150fa`): the window never scrolls, so every test of step 2 passes and the swipe is clean. It was set aside because the toolbar of Safari no longer shrinks while a post is read. It is kept on the local branch `rinn7e/scroll-box-backup`.
4. The window scroll with the three rules above: the swipe shows the list under the finger and the page under it is the list at its scroll, with no blank frame in the Simulator.

## Open question

In Chrome on a Mac, the back button was reported to show the top of the list for a moment, then the list at its scroll. A Chromium driven by Playwright logged the list at its scroll from the first frame after the back, so it is not reproduced yet. Chrome on an iPhone runs on WebKit but handles the back and its snapshots itself, so it can differ from Safari too.

## Sources

1. WebKit: [`ViewGestureControllerIOS.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/ViewGestureControllerIOS.mm) (when the snapshot is shown, which events remove it), [`ViewGestureController.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ViewGestureController.cpp) (the removal tracker and its watchdog), [`WKWebViewIOS.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/API/ios/WKWebViewIOS.mm) (the scroll restored in a frame commit), [`WebBackForwardList.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/WebBackForwardList.cpp) (the snapshot taken when an entry is added), [`HistoryController.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/loader/HistoryController.cpp).
2. [cloudflare/vinext issue 4095](https://github.com/cloudflare/vinext/issues/4095): the back of Safari opened a page at its top because `pushState` ran after the route was drawn.
3. [taion/scroll-behavior issue 128](https://github.com/taion/scroll-behavior/issues/128): freezes after a swipe back with `manual`, on an older WebKit.
