---
title: Pure in-app navigation implemented in Elm (URL become a thin wrapper instead)
description: The model owns where the app is, and one wrapper around update keeps the URL in sync
date: 2026-10-27
tags:
  - elm
  - functional
  - routing
canonicalUrl: https://dev.to/rinn7e/elm-navigation-with-a-thin-url-wrapper-h2j
devToId: 4926667
---

In the usual Elm app the URL is the source of truth. To go somewhere, `update` writes the URL, and the app only moves when the URL comes back as `UrlChanged`. This works, but after a while I found three problems with it, so I tried the other way around: the model owns where the app is, and the URL just follows it. I am writing it down in case I forget, or in case someone else finds it useful.

![The usual way: every move goes through the URL](/blog/elm-navigation-with-a-thin-url-wrapper/usual-way.png)

![The thin URL wrapper: the URL follows the model](/blog/elm-navigation-with-a-thin-url-wrapper/thin-url-wrapper.png)

You can see the sample code here: [https://github.com/rinn7e/elm-navigation-project](https://github.com/rinn7e/elm-navigation-project)

It has the same small blog three times (a list of posts, a post, an about page, a login page, and a page to write a new post that only signed-in users can open):

* `elm-blog`: the usual way, as in [elm-spa-example](https://github.com/rtfeldman/elm-spa-example)
* `elm-blog-url-wrapper`: the thin URL wrapper
* `elm-blog-url-wrapper-screen-naming`: the same as the second one, with other names

The test account is `test` / `testtest`.

## Requirement

This post aims for those who are already familiar with Elm and `Browser.application`.

Every tool is a local dev dependency (Elm, elm-format, Vite with `vite-plugin-elm`, Tailwind v4), so in each app folder this is enough:

```bash
npm install
npm run dev
```

## The usual way

Until the section on opaque types, the snippets show the apps as they were at [this commit](https://github.com/rinn7e/elm-navigation-project/tree/80a01261a1b355ac3b6b35e10fb1899c159bec80). That section adds opaque types to all three apps.

Here are the branches of `update` in `elm-blog` that write the URL:

```elm
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case ( msg, model.page ) of
        ( LinkClicked urlRequest, _ ) ->
            case urlRequest of
                Browser.Internal url ->
                    ( model, Nav.pushUrl model.key (Url.toString url) )

                Browser.External href ->
                    ( model, Nav.load href )

        ( UrlChanged url, _ ) ->
            changeRouteTo (Route.fromUrl url) model

        ( ClickedLogout, _ ) ->
            ( { model | user = Nothing }
            , Cmd.batch [ storeUser Nothing, Route.replaceUrl model.key Route.Home ]
            )

        ( GotLoginMsg subMsg, Login login ) ->
            case Login.update subMsg login of
                ( _, Just user ) ->
                    ( { model | user = Just user }
                    , Cmd.batch [ storeUser (Just user), Route.replaceUrl model.key Route.Home ]
                    )

        -- ...
```

And the guard lives in `changeRouteTo`, where the URL comes back:

```elm
        Just Route.NewPost ->
            if model.user == Nothing then
                ( model, Route.replaceUrl model.key Route.Login )

            else
                ( { model | page = NewPost NewPost.init }, Cmd.none )
```

The problems with this are:

1. **Navigation is spread over `update`.** Every branch that wants to move the app has to write the URL itself. A new branch that forgets it leaves the URL showing something other than the screen.
2. **The echo.** Everything the app writes comes back as `UrlChanged`, so one move is two updates: one that writes the URL, and one that really changes the page. I wrote about this before in [Solving Elm Router "Double Update" Problem](https://dev.to/rinn7e/solving-elm-router-double-update-problem-dde), where I needed an `isInternal` flag to ignore it. With a guard it is even more: a guest clicking "Write" is three messages and two URL writes (`LinkClicked`, push `/new`, `UrlChanged /new`, replace `/login`, `UrlChanged /login`).
3. **The sync.** Between the write and the echo, the model and the URL do not agree. Right after a login, `model.user` is set but the page is still the login page until `UrlChanged` arrives.

## The idea

The URL is not state. It shows where the app is, the same way the view shows what the app holds, so it can be written from the model too:

* The model owns where the app is (the destination). `update` never touches the URL.
* One wrapper around the root `update` writes the URL after every step, from the destination read from the model. A change of destination pushes an entry, the same destination writes nothing.
* The URL is never the source of truth: it is only parsed into a move at boot, on back / forward, and when a link is clicked (Elm hands links to us as URLs). The guard runs on every move, and when it redirects, the URL is corrected with a replace.
* Only one module (`Route`) knows how a destination is spelled as a URL.

## The thin URL wrapper

The `Route` module and the pages do not change at all. Everything below is in `Main.elm` of `elm-blog-url-wrapper`.

### 1. The destination is read, not stored

The page in the model already says where the app is, so the destination is not stored a second time. It is read from the page:

```elm
destinationOf : Model -> Maybe Route
destinationOf model =
    case model.page of
        NotFound ->
            Nothing

        Home ->
            Just Route.Home

        Post slug ->
            Just (Route.Post slug)

        About ->
            Just Route.About

        Login _ ->
            Just Route.Login

        NewPost _ ->
            Just Route.NewPost
```

In a bigger app each part of the model keeps its own piece (the screen shown, an open dialog, a tab) and `destinationOf` puts them together.

### 2. Navigating is a model change

A move goes through the guard, and the destination shown already is dropped. It returns a `Model`, there is no `Cmd`:

```elm
navigate : Maybe Route -> Model -> Model
navigate maybeRoute model =
    let
        destination =
            guard model maybeRoute
    in
    if destination == destinationOf model then
        model

    else
        openPage destination model


guard : Model -> Maybe Route -> Maybe Route
guard model maybeRoute =
    case maybeRoute of
        Just Route.Login ->
            if model.user /= Nothing then
                Just Route.Home

            else
                maybeRoute

        Just Route.NewPost ->
            if model.user == Nothing then
                Just Route.Login

            else
                maybeRoute

        _ ->
            maybeRoute
```

`openPage` is the old `changeRouteTo` without the guard and without the `Cmd`.

So the branches of `update` only change the model. A login sets the user and navigates home, and nothing in `update` knows about the URL:

```elm
        ( LinkClicked urlRequest, _ ) ->
            case urlRequest of
                Browser.Internal url ->
                    ( navigate (Route.fromUrl url) model, Cmd.none )

                Browser.External href ->
                    ( model, Nav.load href )

        ( UrlChanged url, _ ) ->
            ( navigate (Route.fromUrl url) model, Cmd.none )

        ( ClickedLogout, _ ) ->
            ( navigate (Just Route.Home) { model | user = Nothing }
            , storeUser Nothing
            )

        ( GotLoginMsg subMsg, Login login ) ->
            case Login.update subMsg login of
                ( _, Just user ) ->
                    ( navigate (Just Route.Home) { model | user = Just user }
                    , storeUser (Just user)
                    )

        -- ...
```

Links stay `a` tags with an `href` (open in a new tab still works). Elm sends every plain click on them to `onUrlRequest`, so `LinkClicked` is just one more move: it opens the page, it does not push the URL.

### 3. The wrapper

This is the only place that writes the URL:

```elm
updateWithUrl : Msg -> Model -> ( Model, Cmd Msg )
updateWithUrl msg model =
    let
        ( newModel, cmd ) =
            update msg model
    in
    ( newModel, Cmd.batch [ urlCmd msg model newModel, cmd ] )


urlCmd : Msg -> Model -> Model -> Cmd Msg
urlCmd msg model newModel =
    case ( msg, destinationOf newModel ) of
        ( _, Nothing ) ->
            -- The not found page writes no URL: no link of the app leads to it
            Cmd.none

        ( UrlChanged url, Just route ) ->
            if Route.fromUrl url == Just route then
                Cmd.none

            else
                Route.replaceUrl newModel.key route

        ( _, Just route ) ->
            if destinationOf model == Just route then
                Cmd.none

            else if guard newModel (destinationOf model) /= destinationOf model then
                -- The guard would redirect the destination before
                Route.replaceUrl newModel.key route

            else
                Route.pushUrl newModel.key route
```

And it replaces `update` in the program:

```elm
main : Program (Maybe String) Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = updateWithUrl
        , subscriptions = \_ -> Sub.none
        , onUrlRequest = LinkClicked
        , onUrlChange = UrlChanged
        }
```

A back or forward of the browser (`UrlChanged`) has its entry already, so it is only corrected when the guard redirected it. Every other step pushes a new destination, with one exception: when the guard would now redirect the destination you left, its entry is replaced. After a login the login page would only redirect home, so back goes to the page before the login. The same after logging out on `/new`.

Apart from telling a back / forward from the rest, the wrapper decides from the state (the destination before and after the step), not from which branch of `update` moved the app. So it cannot be forgotten.

The echo is still there in Elm (`Nav.pushUrl` and `Nav.replaceUrl` send `UrlChanged`), but now it is harmless: it is the destination shown, so `navigate` drops it and the wrapper writes nothing. No `isInternal` flag is needed.

### 4. Boot

At boot the URL is read once. The page is opened through the guard right away, and the URL is corrected with a replace only when the guard redirected it:

```elm
init : Maybe String -> Url -> Nav.Key -> ( Model, Cmd Msg )
init user url key =
    let
        urlDestination =
            Route.fromUrl url

        bootModel =
            { key = key
            , user = user
            , posts = BlogPost.all
            , page = NotFound
            }

        model =
            openPage (guard bootModel urlDestination) bootModel
    in
    ( model, bootUrlCmd urlDestination model )
```

`bootUrlCmd` compares `urlDestination` with `destinationOf model` and calls `Route.replaceUrl` when they differ.

## What changed

In `src`, only `Main.elm` changed from `elm-blog`. You can check with:

```bash
git diff --no-index elm-blog/src elm-blog-url-wrapper/src
```

* `update` never writes the URL: each branch only changes the model.
* The guard runs on every move, before the page opens: at boot, on back / forward, and inside the app.
* A guest clicking "Write" is two messages (`LinkClicked`, and the echo of `/login`, which is dropped) and one URL write. `/new` is never written.
* Logging out from a page the guard still allows (`/about`) now pushes `/`, so back returns to that page. In `elm-blog` it replaced the entry.
* The model and the URL agree after every step. The not found page is the exception: it writes no URL, which is fine because no link of the app leads to it.

## Opaque types: make impossible updates impossible

This part works with either way of navigating, so I added it to all three apps.

There is one hole left in both. Nothing stops a branch of `update` from writing the page directly:

```elm
{ model | page = NewPost NewPost.init }
```

That compiles, and the guard is skipped for that step. In `elm-blog` a guest now sees the new post page. In the wrapper apps the URL follows to `/new`, and only the echo of it happens to go back through the guard: that is luck, not design. The guard runs only if every move remembers to call it.

So I gave the guard and the page their own modules, with opaque types: the module exposes the type but not its constructor, so only that module can build a value with it.

```elm
module Guard exposing (Guarded, guard, route)


type Guarded
    = Guarded (Maybe Route)


guard : Maybe String -> Maybe Route -> Guarded
-- ...
```

```elm
module CurrentPage exposing (CurrentPage, Page(..), open, page, setLogin, setNewPost)


type CurrentPage
    = CurrentPage Page


open : Guarded -> CurrentPage
```

The model now holds a `CurrentPage`, and the only way to make one is `open`, which takes a `Guarded`, which only `guard` makes. The forms of the login and new post pages still change in place, but only through `setLogin` and `setNewPost`, which keep the page shown.

In `elm-blog`, `changeRouteTo` opens the page through them:

```elm
changeRouteTo : Maybe Route -> Model -> ( Model, Cmd Msg )
changeRouteTo maybeRoute model =
    let
        guarded =
            Guard.guard model.user maybeRoute
    in
    case Guard.route guarded of
        Just route ->
            if Just route /= maybeRoute then
                ( model, Route.replaceUrl model.key route )

            else
                ( { model | page = CurrentPage.open guarded }, Cmd.none )

        Nothing ->
            ( { model | page = CurrentPage.open guarded }, Cmd.none )
```

The wrapper apps use the same two modules, and their `navigate` becomes:

```elm
navigate : Maybe Route -> Model -> Model
navigate maybeRoute model =
    let
        destination =
            Guard.guard model.user maybeRoute
    in
    if Guard.route destination == destinationOf model then
        model

    else
        { model | page = CurrentPage.open destination }
```

And the write from above no longer compiles:

```elm
-- TYPE MISMATCH ----------------------------------------- WritePageDirectly.elm

I cannot update the `page` field like this:

13|     { model | page = NewPost NewPost.init }
                         ^^^^^^^^^^^^^^^^^^^^
This `NewPost` call produces:

    Page

But it should be:

    CurrentPage
```

The same for `CurrentPage.open (Just Route.NewPost)` (a route is not a `Guarded`) and for `Guard.Guarded (Just Route.NewPost)` (the constructor is not exposed). In each app, `npm run check:opaque` compiles these cases from `compile-fail/` and checks that each one fails.

This is "make impossible states impossible", but for updates: the compiler stops a write that skips the owner of the value. Elm needs no tricks for it. There are no casts, and a record update needs a value of the type of the field, which only the owner module can make.

One honest limit: any module can still import `Guard.guard` and `CurrentPage.open`, because they are exposed, and `guard` trusts the user it is given. The types make sure every page went through them, but who calls them, and with what, is still decided by how the modules are laid out.

## Conclusion

That is it. The URL becomes a thin adapter at the edges: written from the model after every step, and parsed into a move only when the browser hands one to us.

If the naming makes it harder to follow, it is because `Route` and `Page` are names from the URL-first way. In `elm-blog-url-wrapper-screen-naming` I changed the names only: `Page` is `Screen` (what the app shows) and `Route` is `Destination` (where the app is):

```elm
type Screen
    = NotFound
    | Home
    | Post String
    | About
    | Login Login.Model
    | NewPost NewPost.Model
```

```elm
destinationOf : Model -> Maybe Destination
destinationOf model =
    case CurrentScreen.screen model.screen of
        NotFound ->
            Nothing

        Home ->
            Just Destination.Home

        -- ...
```

With these names the model holds the current screen, and the destination is read from it.

I hope to hear from others if they reach the same conclusion. Feel free to ask me anything as well.

Thanks for reading!
