---
title: Format Date with Purescript
description: This will be a simple tutorial on how to parse date with purescript using purescript-formatters. I...
date: 2018-10-13
tags:
  - purescript
  - date
  - time
canonicalUrl: https://dev.to/rinn7e/format-date-with-purescript-3g66
devToId: 54802
---

This will be a simple tutorial on how to parse date with purescript using `purescript-formatters`. I will use date from postgres: `2018-09-30T12:27:33.168791` as the example

We will need two functions one that will convert string to datetime and another will display that datetime value.

```haskell
parseDate :: String -> Either DateTime
displayDate :: DateTime -> String
```



We will need 2 formatters for both decode and display:

```haskell
parseFormatter :: Formatter
parseFormatter =  unsafePartial fromRight $  parseFormatString "YYYY-MM-DDTHH:mm:ss"

displayFormatter :: Formatter
displayFormatter =  unsafePartial fromRight $  parseFormatString "hh:mm:ss, DD MMM YYYY"
```




Then we can use this formatter in our previous functions

```haskell
parseDate :: String -> Either String DateTime
parseDate s = 
    unformat parseFormatter s

displayDate :: DateTime -> String
displayDate d = 
    format displayFormatter d
```



We can combine them together

```haskell
parseAndDisplay :: String -> String
parseAndDisplay s = 
    either (\err -> err) (\d -> displayDate d) $ parseDate s
```




If you run this, you may have noticed a run time error. Because our seconds is in fraction. We do not need that so we can just drop them off.

```haskell
parseAndDisplay :: String -> String
parseAndDisplay s = 
    either (\err -> err) (\d -> displayDate d) $ parseDate $ String.take 19 s
```



If you run this with input `2018-09-30T12:27:33.168791`, you will get `12:27:33, 30 Sep 2018`



There you go here is the full code

```haskell
import Prelude 

import Data.Either (Either, either, fromRight)
import Data.String as String
import Data.DateTime (DateTime)

import Data.Formatter.DateTime (Formatter, parseFormatString, unformat, format)
import Partial.Unsafe (unsafePartial)

parseFormatter :: Formatter
parseFormatter =  unsafePartial fromRight $ parseFormatString "YYYY-MM-DDTHH:mm:ss"

displayFormatter :: Formatter
displayFormatter =  unsafePartial fromRight $ parseFormatString "hh:mm:ss, DD MMM YYYY"

parseDate :: String -> Either String DateTime
parseDate s = 
    unformat parseFormatter s

displayDate :: DateTime -> String
displayDate d = 
    format displayFormatter d

parseAndDisplay :: String -> String
parseAndDisplay s = 
    either (\err -> err) (\d -> displayDate d) $ parseDate $ String.take 19 s
```
