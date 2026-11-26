---
title: Difference between monad-transfomer, mtl, and mtl-style technique
description: This post is mean to explain the differences between the 3. These 3 terms come ...
date: 2019-03-06
tags:
  - haskell
  - monad
  - monadtransformer
  - mtl
devToUrl: https://dev.to/rinn7e/dead-simple-explanation-of-the-difference-between-monad-transfomer-mtl-and-mtl-style-technique-5cf1
devToId: 88779
---

This post is mean to explain the differences between the 3. These 3 terms come up regularly and it is important to differentiate them. 

###Requirement
This post aims for the pre-intermediate haskell programmers that have already learn the fundamental concept (monad, functor ...) and have written some haskell program already. 

#Monad Transformer

`monad-transformer` is a type container such as `ReaderT`, `WriterT` ... We will focus on the use-case only. 

When people refer to `monad-transformer` they usually mean something their `monad-transformer` stack: `newtype AppM a = ReaderT Env (LoggingT IO) a`

The reason why haskell application use this stack over just `IO ()` because `monad-transformer` provide extra functionality for example `ReaderT` provide `ask` function to get env variable instead of passing it in all the functions. 

#MTL - Monad Transformer Library

`mtl` library define various typeclasses that help working with monad-transformer. Remember that `mtl` is a library not a `monad-transformer`. 

The reason why mtl is created because when we define a function to work with `monad-transformer` stack, we do not want to use `AppM` in the function type.

For example:
- instead of this `askEnvAndReadFile :: FilePath -> AppM String` 
- we want to use this `askEnvAndReadFile :: (MonadReader Env m, MonadIO m) -> FilePath -> m String` 

MonadReader and MonadIO are typeclasses that show that the function can ask for Env and can do IO action. This function can be use within any `monad-trasnformer` stack that has ReaderT and IO in them, not just our predefined AppM.

#MTL-style (tagless final)

Sometimes when mtl is being discussed, it is not about the mtl library itself but the techniques that mtl library uses which is the Tagless Final. I will not provide detail explanation of this, but basically this is a technique that help haskell programmer write function with business model constraint.

For example, we want to define a function that can manage certain resources (make api call to get the resources). We do not want the function to be able to do any IO action.
Below show a function that can only make http call and log, not any other action 
```haskell
app :: (ManageResource m, HasLogging m) -> m ()
app = do
    result <- makeApiCall
    log (show result)
    pure ()

```

Notice that `ManageResource` and `HasLogging` is a typeclass that has nothing to do with mtl library, but instead we define this by ourself:

```haskell
class (Monad m) => ManageResource m where
  makeApiCall :: m Resource

```
This is just an interface only, the implementation `makeApiCallIO` will have `MonadIO` constraint or return IO monad: `makeApiCallIO :: IO Resource)`.
So when we want to use this function with our stack AppM we can define an instance for this `ManageResource` typeclass.
```haskell
instance ManageResource AppM where
  makeApiCall = makeApiCallIO
```

The useful thing of using typeclass constraints instead of concrete type such as `AppM` is that we can use a mock stack MockM where we do not actually do any IO action. 

Example:
```haskell
makeApiCallMock :: m Resource
makeApiCallMock = pure someMockData

instance ManageResource MockM where
  makeApiCall = makeApiCallMock
```

##Conclusion

As we can see, the 3 terms are different. The most important thing is the `mtl-style` technique that is used a lot in realworld haskell application (HasDatabase, HasLogging ...). It is important to be able to read other people constraint typeclasses as well as create our own. I was confused to this 3 terms as well before, hope this clears up some misunderstanding.

###Detail Source:
1. https://serokell.io/blog/2018/12/07/tagless-final
2. https://ocharles.org.uk/posts/2016-01-26-transformers-free-monads-mtl-laws.html
