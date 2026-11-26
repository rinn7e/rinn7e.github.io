---
title: Solving Elm Router "Double Update" Problem
description: I found some older discussions on this issue, but they did not really provide a clear...
date: 2025-09-16
tags:
  - elm
  - functional
canonicalUrl: https://dev.to/rinn7e/solving-elm-router-double-update-problem-dde
devToId: 2849012
---

I found some older discussions on this issue, but they did not really provide a clear answer:

* [Understanding the "double update" behavior of Browser.application](https://discourse.elm-lang.org/t/understanding-the-double-update-behavior-of-browser-application/2963)
* [Routing when you are already there](https://discourse.elm-lang.org/t/routing-when-you-already-there/7977)

It turns out I discovered a simple solution, so I am writing it down in case I forget, or in case someone else finds it useful.

Imagine we have an expensive `parseAppRoute` function that performs many effects. We do not want it to run twice: once for `Navigate` and again for `UrlChanged`. (I am ignoring `LinkClicked` in this explanation, since in my app I only use `Navigate`, but the principle is the same.)

The idea is to keep track of a boolean flag called `isInternal` that indicates whether the URL change originated from inside the app or from an external action such as the browser's back/forward buttons. By default this flag is `False`, because back/forward navigation can happen at any time.

Whenever I change the route from inside the app, I set `isInternal` to `True`. Then, when the follow-up `UrlChanged` message arrives, I check the flag:

* If it is `True`, I ignore the message and reset the flag to `False`.
* If it is `False`, I know the change came from the browser (back/forward), so I call `parseAppRoute`.

This way we avoid calling handling the route change twice.

On initial page load, the route is handled in `init`, so there is no issue there either.

Here is an example implementation:

```elm
parseAppRoute : String -> (Route, Cmd Msg) 
parseAppRoute url =
   let
      newRoute = urlStringToRoute url
   in
      (newRoute, getCmdFrom newRoute)

cmdFromRoute : Route -> Cmd Msg
cmdFromRoute route =
    -- perform expensive side effects


init : Flags -> Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    let
        (initRoute, initCmd) = parseAppRoute url
    in
    ( { route = initRoute
      , isInternal = False
      , key = key
      }
    , initCmd
    )


-- UPDATE

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UrlChanged url ->
            if model.isInternal then
                -- Ignore the UrlChanged that we triggered ourselves;
                -- then reset the flag.
                ( { model | isInternal = False }, Cmd.none )

            else
                -- Triggered by browser back/forward navigation
                let
                    (newRoute, newCmd) = parseAppRoute url
                in
                ( { model | route = newRoute }, newCmd )

        Navigate route ->
            let
                href = toUrlString route
                newRouteCmd = cmdFromRoute route
            in
            ( { model
                | isInternal = True -- Mark this as an internal change
                , route = route
              }
            , Cmd.batch [ Nav.pushUrl model.key href, newRouteCmd ]
            )

        LinkClicked req ->
            case req of
                Browser.Internal url ->
                    -- Treat internal clicks like Navigate
                    let
                        (newRoute, newCmd) =
                            parseAppRoute url
                    in
                    ( { model | isInternal = True, route = newRoute }
                    , Cmd.batch
                        [ Nav.pushUrl model.key (Url.toString url)
                        , newCmd
                        ]
                    )

                Browser.External href ->
                    ( model, Nav.load href )

        None ->
            ( model, Cmd.none )
```

I hope to hear from others if they reach the same conclusion. Feel free to ask me anything as well.
