---
title: Display and Edit Google Map in Elm
description: Using google map in elm is a bit tricky. This tutorial will show how to initialize the map, edit the map, and get the map data through port.
date: 2017-11-05
tags:
  - elm
  - googlemap
  - web
canonicalUrl: https://dev.to/rinn7e/display-and-edit-google-map-inelm-dg1
devToId: 11513
---

Using google map in elm is a bit tricky. This tutorial will show how to initialize the map, edit the map, and get the map data through port.

Preview: https://chmar77.github.io/elm-google-map-tutorial/

## Requirement
This tutorial aims for those who already familiar with elm.

The tool that is needed:
- elm: ` npm install -g elm`
- elm-live: ` npm install -g elm-live`

## Setting up project
- Create following folder structure

```
elm-google-map
â”œâ”€â”€ src
â”‚   â”œâ”€â”€ Main.elm
â”‚   â”œâ”€â”€ Map.elm
â”‚   â””â”€â”€ Port.elm
â””â”€â”€ index.html
```


- In index.html, copy the following code

```
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Elm Google Map</title>
    <style>
    html, body{
        margin:0;
        padding:0;
    }
    #map {
        height:300px;
        width:300px;
    }
    #edit-map {
        height:300px;
        width:300px;
    }
    .hidden{
        visibility: hidden;
        height:0;
        width:0;
    }
    </style>
  </head>

  <body>
    <script src="dist/elm.js"></script>
    <script>
    var app = Elm.Main.fullscreen();

    </script>
  </body>
</html>

```

- Run: `elm-package install` 
- Copy the following code in Main.elm

```elm
module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)


main : Program Never Model Msg
main =
    Html.program
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


type alias Model =
    { title : String
    }


init : ( Model, Cmd Msg )
init =
    ( { title = "Elm Google Map" }, Cmd.none )


type Msg
    = NoOp


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )


view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text "Elm Google Map" ]
        ]


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none

```

- In elm-package.json, change the source-directories from "." to "src"
```
 "source-directories": [
        "src"
 ],

```

- Run `elm-live src/Main.elm --output=dist/elm.js ` in the root folder of our project and go to http://localhost:8000/ to see our initialized project

- If you see 'Elm Google Map' then it means everything is working fine

## Creating Map Module
- Copy the following code:

```elm
module Map exposing (Model, JsObject, init, modify, toJsObject)


type Model
    = Internal
        { latitude : Float
        , longtitude : Float
        }


init : Model
init =
    Internal
        { latitude = 11.55408504200135
        , longtitude = 104.910961602369
        }


modify : Float -> Float -> Model -> Model
modify latitude longtitude (Internal model) =
    Internal
        { model
            | latitude = latitude
            , longtitude = longtitude
        }


type alias JsObject =
    { lat : Float
    , lng : Float
    }


toJsObject : Model -> JsObject
toJsObject (Internal model) =
    { lat = model.latitude
    , lng = model.longtitude
    }

```

Here we are trying to make our module hidden. Record that uses the Model type, when accessing or modifying will need the function from the module. It cannot access the record directly.

## Port Module

```elm
port module Port exposing (..)

import Map


-- Outgoing Port


port initializeMap : Map.JsObject -> Cmd msg


port initializeEditMap : Map.JsObject -> Cmd msg


port moveMap : Map.JsObject -> Cmd msg



-- Incoming Port


port mapMoved : (Map.JsObject -> msg) -> Sub msg

```

Here we divides out port into 2 parts, incoming and outgoing. 

## Javascript part
- add google map script below elm.js script
```
<script src="https://maps.googleapis.com/maps/api/js?key={{your-api-key}}"></script>
```
- pass the following code below `var app = Elm.Main.fullscreen();` in index.html

```javascript
app.ports.initializeMap.subscribe(function (pos) {
    console.log("Initialize Map")
    var mapDiv = document.getElementById('map');
    console.log(pos);
    if (mapDiv) {
    // Map
    var myLatlng = new google.maps.LatLng(pos);
    var mapOptions = {
        zoom: 15,
        center: myLatlng
    };
    var gmap = new google.maps.Map(mapDiv, mapOptions);
    
    // Marker
    var marker = new google.maps.Marker({
        position: myLatlng,
        title: "Hello World!"
    });
    marker.setMap(gmap);

    // Listening for map move event
    app.ports.moveMap.subscribe(function (pos) {
        console.log("received", pos);
        var myLatlng = new google.maps.LatLng(pos);
        gmap.setCenter(myLatlng);
        marker.setPosition(myLatlng)
    });

    
    } else {
    console.log ("Cant find map dom");
    }

});
```

Here we just create an event listening to initializeMap port from elm. The moveMap event will be used later on when we try to edit the map.

## Back to Main Module
- We can import out Map and Port Module

```elm
import Map
import Port
```

- Update our Model, and init

```elm
type alias Model =
    { title : String
    , map : Map.Model
    }
```
```elm
init : ( Model, Cmd Msg )
init =
    ( { title = "Elm Google Map"
      , map = Map.init
      }
    , Map.init
        |> Map.toJsObject
        |> Port.initializeMap
    )
```

- Finally update our view

```elm
view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text model.title ]
        , p [] [ text <| "Current pointer" ++ (toString <| Map.toJsObject model.map) ]
        , div []
            [ div [ id "map" ] []
            ]
        ]
```

- If your are not running elm-live, run `elm-live src/Main.elm --output=dist/elm.js ` again and go to http://localhost:8000/ 
- If you are able to see the map, then everything is working as expected

## Editing Map
- First add additional javascript below the previous one in index.html

```javascript
app.ports.initializeEditMap.subscribe(function (pos) {
    console.log("Initialize Edit Map")
    var mapDiv = document.getElementById('edit-map');
    console.log(pos);

    if (mapDiv) {
        // Map
        var myLatlng = new google.maps.LatLng(pos);
        var mapOptions = {
            zoom: 15,
            center: myLatlng
        };
        var gmap = new google.maps.Map(mapDiv, mapOptions);
        
        // Marker
        var marker = new google.maps.Marker({
            position: myLatlng,
            title: "Hello World!"
        });
        marker.setMap(gmap);

        gmap.addListener('drag', function () {
            var newPos = {
            lat: gmap.getCenter().lat(),
            lng: gmap.getCenter().lng()
            };

            marker.setPosition(newPos);
            
            app.ports.mapMoved.send(newPos);
        });

    } else {
        console.log ("Cant find edit map dom");
    }

});
```

- Back in Main.elm, add State type to our Model so that we can edit the map

```elm
type alias Model =
    { title : String
    , map : Map.Model
    , state : State
    }

type State
    = View
    | Edit

init : ( Model, Cmd Msg )
init =
    ( { title = "Elm Google Map"
      , map = Map.init
      , state = View
      }
    , Map.init
        |> Map.toJsObject
        |> Port.initializeMap
    )
```
- Then add edit button and editView in the view function

```elm
view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text model.title ]
        , p [] [ text <| "Current pointer" ++ (toString <| Map.toJsObject model.map) ]
        , div []
            [ div [ id "map" ] []
            , button [ onClick EditMap ] [ text "Edit" ]
            ]
        , editView model
        ]
```

- Copy the following code for the editView
 
```elm
editView : Model -> Html Msg
editView model =
    div
        [ class <|
            case model.state of
                View ->
                    "hidden"

                Edit ->
                    ""
        ]
        [ hr [] []
        , div [ id "edit-map" ] []
        , button [ onClick SaveEditMap ] [ text "Done" ]
        ]
```

- We also want to listen to the drag event when editing. We can do that by modifying our subscription

```elm
subscriptions : Model -> Sub Msg
subscriptions model =
    Port.mapMoved OnEditMapDrag
```

- As you can see about, we create a few new msg and we will have to create and handle them

```elm
type Msg
    = NoOp
    | EditMap
    | OnEditMapDrag Map.JsObject
    | SaveEditMap
```

- In our update function

```elm
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        EditMap ->
            ( { model | state = Edit }
            , model.map
                |> Map.toJsObject
                |> Port.initializeEditMap
            )

        OnEditMapDrag { lat, lng } ->
            ( { model | map = Map.modify lat lng model.map }
            , Cmd.none
            )

        SaveEditMap ->
            ( { model | state = View }
            , model.map
                |> Map.toJsObject
                |> Port.moveMap
            )
```

## This is it

The source code is here: https://github.com/chmar77/elm-google-map-tutorial
Preview: https://chmar77.github.io/elm-google-map-tutorial/

That's the end of the tutorial. If something is not working for you, or needs explanation of certain things you do not understand, comment down below. 

Thanks for reading !!!
