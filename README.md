
# Table of contents

15. [Exploring Coroutines](#exploring coroutines)
   1. [Coroutines and Concurrency](#coroutines and concurrency)
   2. [Lambda Expressions](#lambda_expressions)
   3. [Lambdas and Anonymous Functions](#lambdas_and_anonymous_functions)
   4. [Closures and Lexical Scoping](#closures_and_lexical_scoping)
   5. [Non-Local and Labeled return](#non-local_and_labeled_return)
   6. [Inlining Functions with Lambdas](#inlining_functions_with_lambdas)
   7. [Wrapping Up](#wrapping_up)

## 15. Exploring Coroutines <a name="exploring_coroutines"></a>

### 15.1 Coroutines and Concurrency <a name="the_functional_style"></a>

- Sequential execution: Execute task one after the other
- Non-sequential: 
  - Parallel: When two tasks run at the same time on different threads.
  - Concurrent: When two tasks run on the same thread alternating between them.

#### Coroutines as Cooperating Functions:

Subroutines are more common than coroutines in general-purpose program-
ming. Subroutines are functions that run to completion before returning to
the caller. Subroutines don’t maintain any state between calls. 
Coroutines are also functions but behave differently than subroutines. 
Unlike subroutines, which have a single point of entry, coroutines have 
multiple points of entry. Additionally, coroutines may remember state between calls.


#### Basics of coroutines

The two most important building blocks to create/start/run new coroutines 
are coroutine scope and coroutine builders. Coroutine scope consists of 
all the machinery required to run coroutine, for example, it knows where 
(on which thread) to run coroutine and coroutine builders are used to 
create a new coroutine.

public interface CoroutineScope {
    public val coroutineContext: CoroutineContext
}

Coroutine context is immutable, but you can add elements to a context 
using plus operator, just like you add elements to a set, producing a new context instance.
A coroutine itself is represented by a Job. It is responsible for coroutine’s 
lifecycle, cancellation, and parent-child relations. A current job can be 
retrieved from a current coroutine’s context: coroutineContext[Job]

The important thing you need to know is that whenever a new coroutine scope 
is created, a new job gets created and gets associated with it.

There is also an interface called CoroutineScope that consists 
of a sole property — val coroutineContext: CoroutineContext. It 
has nothing else but a context. So, why it exists and how is it 
different from a context itself? The difference between a context 
and a scope is in their intended purpose. I swear I tried to understand 
this but it's difficult:
https://elizarov.medium.com/coroutine-context-and-scope-c8b255d59055

| Dispatcher         | Description | Uses                         |
| -------------------| ----------- | ---------------------------- |
|Dispatchers.Main    | Main thread | - Calling suspended functions<br>- Call UI functions|
|Dispatchers.IO      | Disk and netowrk IO| - Db, other netowrk calls<br> - File IO|
|Dispatchers.Default | CPU instensive work  | - Sorting list/other alg<br>- Parsing JSON|

CoroutineContext
It is simply a map between Key and Element (Key -> Element) where
Key: Key for the elements of type CoroutineContext
Element: Subtype of CoroutineContext, for example, Job, Deferred, CoroutineDispacher, ActorCoroutine, etc.

Launch
This creates new coroutine and returns a reference to coroutine as Job.
Launch is used to perform asynchronous fire and forget type of operations 
where you are not interested in the result of operation.

Async
This creates new coroutine and returns a reference to coroutine as Deferred. 
Using this handle, you can manually cancel launched coroutine using the 
cancel method available on Deferred. Async is used to perform asynchronous 
computation where you expect a result of the computation in the future. Once 
the result is available, you want to perform other operations using this result.

What is the default behavior of launch and async?
The execution of coroutine starts immediately
You can override this behavior by passing the different CoroutineStart 
argument while launching coroutine, for example, start = CoroutineStart.LAZY

Reasons for CPU-bpund IO and default: https://gist.github.com/djspiewak/46b543800958cf61af6efa8e072bfd5c

### 15.2 Running Concurrently Using Coroutines <a name="the_functional_style"></a>

In Kotlin coroutines are built into the language, but the convenience functions to 
work with coroutines are part of a library. Coroutines offer some capabilities that 
aren’t possible with subroutines. They’re used in infinite sequences, event loops, 
and cooperating functions, for example.


#### Starting with Sequential Execution
```kotlin
fun task1() {
   println("start task1 in Thread ${Thread.currentThread()}")
   println("end task1 in Thread ${Thread.currentThread()}")
}

fun task2() {
   println("start task2 in Thread ${Thread.currentThread()}")
   println("end task2 in Thread ${Thread.currentThread()}")
}

println("start")

run {
   task1()
   task2()
   println("called task1 and task2 from ${Thread.currentThread()}")
}

println("done")
```
```
start
start task1 in Thread Thread[main,5,main]
end task1 in Thread Thread[main,5,main]
start task2 in Thread Thread[main,5,main]
end task2 in Thread Thread[main,5,main]
called task1 and task2 from Thread[main,5,main]
done
```
The function calls are executing sequentially with task1() completing, 
then task2() starting and then running to completion.

#### Creating a Coroutine

As stated previously, you need to donwload an extension library to work 
with coroutines. It is available as a Maven Package.
```kotlin
import kotlinx.coroutines.*

fun task1() {
   println("start task1 in Thread ${Thread.currentThread()}")
   println("end task1 in Thread ${Thread.currentThread()}")
}

fun task2() {
   println("start task2 in Thread ${Thread.currentThread()}")
   println("end task2 in Thread ${Thread.currentThread()}")
}

println("start")

runBlocking {
   task1()
   task2()
   println("called task1 and task2 from ${Thread.currentThread()}")
}

println("done")
```
First is the import from the kotlinx.coroutines.* package. Second, we
replaced run() with runBlocking(). The runBlocking() function takes a 
lambda as an argument and executes that within a coroutine.

The output of the sequential version of code is the same as the output 
of the version that uses coroutines.

#### Launching a Task

Let’s launch the two functions, task1() and task2(), to execute in two different
coroutines and then display a message that we’ve invoked the tasks. 

```kotlin

runBlocking {
   launch { task1() }
   launch { task2() }
   println("called task1 and task2 from ${Thread.currentThread()}")
}

```
The launch() function starts a new coroutine to execute the given lambda, much
like the runBlocking() function does, except the invoking code isn’t blocked for
the completion of the coroutine. And, unlike the runBlocking() function, the
launch() function returns a job, which can be used to wait on for completion or
to cancel the task.

```
start
called task1 and task2 from Thread[main,5,main]
start task1 in Thread Thread[main,5,main]
end task1 in Thread Thread[main,5,main]
start task2 in Thread Thread[main,5,main]
end task2 in Thread Thread[main,5,main]
done
```
The message that the two tasks were called is printed right after the line with the
start message. We then see task1() run to completion and then task2(), followed
by the message done at the end.
All the code still executes in the main thread, but we can see how the last line
within the lambda executed before either task1() or task2(). That’s at least a sign
of concurrency, more than in the previous version.

#### Interleaving Calls with Suspension Points

Kotlin coroutines library comes with suspension points — a function that will suspend
execution of the current task and let another task execute. There are two functions
to achieve this in the kotlinx.coroutines library: delay() and yield().

The delay() function will pause the currently executing task for the duration
of milliseconds specified. The yield() method doesn’t result in any explicit
delays. But both these methods will give an opportunity for another pending
task to execute.

The yield() function is like the nice command in Unix-like systems. By being
nice you may lower your processes priority on these systems. In Kotlin, your
task can be nice, using yield(), to other tasks that may have more important
things to do.

Kotlin will permit the use of suspension points only in functions that are annotated 
with the suspend keyword. Marking a function with suspend doesn’t automatically make 
the function run in a coroutine or concurrently, however.

```kotlin
import kotlinx.coroutines.*

suspend fun task1() {
   println("start task1 in Thread ${Thread.currentThread()}")
   yield()
   println("end task1 in Thread ${Thread.currentThread()}")
}

suspend fun task2() {
   println("start task2 in Thread ${Thread.currentThread()}")
   yield()
   println("end task2 in Thread ${Thread.currentThread()}")
}

println("start")

runBlocking {
   launch { task1() }
   launch { task2() }
   println("called task1 and task2 from ${Thread.currentThread()}")
}

println("done")
```

```
start
called task1 and task2 from Thread[main,5,main]
start task1 in Thread Thread[main,5,main]
start task2 in Thread Thread[main,5,main]
end task1 in Thread Thread[main,5,main]
end task2 in Thread Thread[main,5,main]
done
```

The examples illustrated the behavior of coroutines, but it leaves us with the
question, When will we use them? Suppose we have multiple tasks that can’t
be run in parallel, maybe due to potential contention of shared resources
used by them. Running the tasks sequentially one after the other may end
up starving all but a few tasks. Sequential execution is especially not desirable
if the tasks are long running or never ending. In such cases, we may let
multiple tasks run cooperatively, using coroutines, and make steady progress
on all tasks. We can also use coroutines to build an unbounded stream of
data—see Creating Infinite Sequences, on page 303.

### 15.3 Coroutine Context and Threads <a name="the_functional_style"></a>

The call to the launch() and runBlocking() functions resulted in the coroutines
executing in the same thread as the caller’s coroutine scope.

#### Explicitly Setting a Context

You may pass a CoroutineContext to the launch() and runBlocking() functions to set
the execution context of the coroutines these functions start.
The value of Dispatchers.Default for the argument of type CoroutineContext instructs
the coroutine that is started to execute in a thread from a DefaultDispatcher pool.
The number of threads in this pool is either 2 or equal to the number of cores
on the system, whichever is higher. This pool is intended to run computation-
ally intensive tasks.
The value of Dispatchers.IO can be used to execute coroutines in a pool that is
dedicated to running IO intensive tasks. That pool may grow in size if threads
are blocked on IO and more tasks are created.


```kotlin
import kotlinx.coroutines.*

suspend fun task1() {
   println("start task1 in Thread ${Thread.currentThread()}")
   yield()
   println("end task1 in Thread ${Thread.currentThread()}")
}

suspend fun task2() {
   println("start task2 in Thread ${Thread.currentThread()}")
   yield()
   println("end task2 in Thread ${Thread.currentThread()}")
}

println("start")

runBlocking {
   launch(Dispatchers.Default) { task1() }
   launch { task2() }
   println("called task1 and task2 from ${Thread.currentThread()}")
}

println("done")
```

```
start
start task1 in Thread Thread[DefaultDispatcher-worker-1,5,main]
end task1 in Thread Thread[DefaultDispatcher-worker-2,5,main]
called task1 and task2 from Thread[main,5,main]
start task2 in Thread Thread[main,5,main]
end task2 in Thread Thread[main,5,main]
done
```

https://pl.kotl.in/6LUQIGFeZ


After this change, the code in task1() will run in a different thread than the
rest of the code that still runs in the main thread. In this case, the code within 
the lambda passes to runBlocking(), and the code within task2() runs concurrently, 
but the code within task1() is running in parallel.
Coroutines may execute concurrently or in parallel, depending on their context.

#### Running in a Custom Pool

You know how to set a context explicitly, but the context we used in the pre-
vious example was the built-in DefaultDispatcher. If you’d like to run your
coroutines in your own single thread pool, you can do that as well. Since
you’ll have a single thread in the pool, the coroutines using this context will
run concurrently instead of in parallel. This is a good option if you’re con-
cerned about resource contention among the tasks executing as coroutines.

To set a single thread pool context, we first have to create a single thread
executor. For this we can use the JDK Executors concurrency API from the
java.util.concurrent package. Once we create an executor, using the JDK library,
we can use Kotlin’s extension functions to get a CoroutineContext from it using
an asCoroutineDispatcher() function.

You may be tempted to create a dispatcher from the single thread executor
and pass that directly to launch(), but there’s a catch. If we don’t close the
executor, our program may never terminate. That’s because there’s an active
thread in the executor’s pool, in addition to main, and that will keep the JVM
alive. We need to keep an eye on when all the coroutines complete and then
close the executor. But that code can become hard to write and error prone.
Thankfully, there’s a nice use() function that will take care of those steps for
us.

```kotlin
import kotlinx.coroutines.*
import java.util.concurrent.Executors

suspend fun task1() {
   println("start task1 in Thread ${Thread.currentThread()}")
   yield()
   println("end task1 in Thread ${Thread.currentThread()}")
}

suspend fun task2() {
   println("start task2 in Thread ${Thread.currentThread()}")
   yield()
   println("end task2 in Thread ${Thread.currentThread()}")
}

Executors.newSingleThreadExecutor().asCoroutineDispatcher().use { context ->
   println("start")
   runBlocking {
      launch(context) { task1() }
      launch { task2() }
      println("called task1 and task2 from ${Thread.currentThread()}")
   }
   println("done")
}
```
```
start
start task1 in Thread Thread[pool-1-thread-1,5,main]
end task1 in Thread Thread[pool-1-thread-1,5,main]
called task1 and task2 from Thread[main,5,main]
start task2 in Thread Thread[main,5,main]
end task2 in Thread Thread[main,5,main]
done
```
Changing from a single thread to as many as your system can provide:

```kotlin
Executors.newSingleThreadExecutor().asCoroutineDispatcher().use { context ->
```
```kotlin
Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors())
.asCoroutineDispatcher().use { context ->
```

#### Switching Threads After Suspension Points

What if you want a coroutine to start in the context of the caller but switch
to a different thread after the suspension point? In other words, as long as
the task involves quick computations, you may want to do that in the current
thread, but in the instance we hit a time-consuming operation, we may want
to delegate that to run on a different thread. We can achieve this by using
the CoroutineContext argument along with a CoroutineStart argument.

To run the coroutine in the current context, you may set the value of the
second optional argument of launch() to DEFAULT, which is of type CoroutineStart.
Alternatively, use LAZY to defer execution until an explicit start() is called,
ATOMIC to run in a non-cancellable mode, and UNDISPATCHED to run initially in
the current context but switch threads after the suspension point.

```kotlin
import kotlinx.coroutines.*
import java.util.concurrent.Executors
suspend fun task1() {
   println("start task1 in Thread ${Thread.currentThread()}")
   yield()
   println("end task1 in Thread ${Thread.currentThread()}")
}

suspend fun task2() {
   println("start task2 in Thread ${Thread.currentThread()}")
   yield()
   println("end task2 in Thread ${Thread.currentThread()}")
}

Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors())
   .asCoroutineDispatcher().use { context ->
   println("start")
   runBlocking {
      @UseExperimental(ExperimentalCoroutinesApi::class)
      launch(context = context, start = CoroutineStart.UNDISPATCHED) { task1() }
      launch { task2() }
      println("called task1 and task2 from ${Thread.currentThread()}")
   }
   println("done")
}
```
The CoroutineStart.UNDISPATCHED option is an experimental feature in the 
kotlinx.coroutines library.

```
start
start task1 in Thread Thread[main,5,main]
end task1 in Thread Thread[pool-1-thread-1,5,main]
called task1 and task2 from Thread[main,5,main]
start task2 in Thread Thread[main,5,main]
end task2 in Thread Thread[main,5,main]
done
```

#### Changing the CoroutineContext

To start a coroutine in one context and then change the context midway, 
Kotlin has a function: withContext().

```kotlin
runBlocking {
   println("starting in Thread ${Thread.currentThread()}")
   withContext(Dispatchers.Default) { task1() }
   launch { task2() }
   println("ending in Thread ${Thread.currentThread()}")
}
```
```
starting in Thread Thread[main,5,main]
start task1 in Thread Thread[DefaultDispatcher-worker-1,5,main]
end task1 in Thread Thread[DefaultDispatcher-worker-1,5,main]
ending in Thread Thread[main,5,main]
start task2 in Thread Thread[main,5,main]
end task2 in Thread Thread[main,5,main]
```

### 15.4 Debugging Coroutines <a name="the_functional_style"></a>

### 15.5 async and await <a name="the_functional_style"></a>

### 15.6 A Peek at Continuations <a name="the_functional_style"></a>

### 15.7 Creating Infinite Sequences <a name="the_functional_style"></a>

### 15. 8 Wrapping Up <a name="the_functional_style"></a>




Functional style:
```kotlin
val doubleOfEven = (1..10) 
 .filter { e -> e % 2 == 0}
 .map { e -> e * 2 }
println(doubleOfEven) //[4, 8, 12, 16, 20]
```

#### Why and When to Use Functional Style

- Imperative style is familiar, but complex; it’s easier to write, due to our familiarity, but is hard to read.
- Functional style is less familiar, but simpler; it’s harder to write, due to our unfamiliarity, but is easier to read.
 - it has less complexity baked in compared to imperative-style code
 - it’s much easier to make functional code concurrent than to make imperative code concurrent

Use the functional style when 
 - the code is mostly focused on computations — you can avoid mutability and side effects
 - and for the problems that can be expressed in terms of series of transformations. 
 
Imperative style may be a better option if the problem at hand 
 - involves a lot of IO, 
 - has unavoidable state mutation or side effects, 
 - or if code will have to deal with many levels of exceptions

### 10.2 Lambda Expressions <a name="lambda_expressions"></a>

Lambdas are short functions that are used as arguments to higher-order functions. 
Rather than passing data to functions, we can use lambdas to pass a piece of executable code to functions. 
Instead of using data to make decisions or perform calculations, the higher-order functions can rely on the lambdas to make decisions or perform calculations.

#### Structure of Lambdas

A lambda expression is a function with no name whose return type is inferred. Generally a function has four parts: name, return type, parameters list, and body. Lambdas carry over only the most essential parts of a function—the parameters list and body.

syntax:
```
{ parameter list -> body }
```

When passing a lambda to a function as argument, avoid the urge to create multiline lambdas unless it’s the last argument. 
Having multiple lines of code in the middle of the argument list makes the code very hard to read, defeating the benefits of fluency we aim to get from lambdas.

#### Passing Lambdas

```kotlin
fun isPrime(n: Int) = n > 1 && (2 until n).none({ i: Int -> n % i == 0 })
//                             ^^^IntRange ^^^none(predicate: (T) -> Boolean): Boolean
```

none method uses parametric type T which is specialized to Int in this context. Thus, we can drop the type from the lambda’s parameter list:
```kotlin
runBlocking {
   println("starting in Thread ${Thread.currentThread()}")
   withContext(Dispatchers.Default) { task1() }
   launch { task2() }
   println("ending in Thread ${Thread.currentThread()}")
}
```

Since the version of none() we’re using takes only one parameter, we can drop the parenthesis () in the call:
```kotlin
fun isPrime(n: Int) = n > 1 && (2 until n).none { i -> n % i == 0 }
```

#### Using the Implicit Parameter

If the lambdas passed to a function take only one parameter, like i in the previous example, then we can omit the parameter declaration and use a special implicit name it instead.
```kotlin
fun isPrime(n: Int) = n > 1 && (2 until n).none { n % it == 0 }
```
The only downside is you can’t quickly tell if a lambda is a no-parameter lambda or if it takes one parameter that’s referenced using it. Again, if the lambda is extremely short, this isn’t a real concern. 

#### Receiving Lambdas

types of lambda parameters are specified using the transformational syntax: (types list) -> output type
```kotlin
fun walk1To(action: (Int) -> Unit, n: Int) = (1..n).forEach { action(it) }

walk1To({ i -> print(i) }, 5) //12345
// ^^^ this call is a bit noisy
```

#### Use Lambda as the Last Parameter

Kotlin makes a concession: it bends the rules for a lambda in the trailing position to reduce noise:
```kotlin
fun walk1To(n: Int, action: (Int) -> Unit) = (1..n).forEach { action(it) }

walk1To(5, { i -> print(i) }) //12345

walk1To(5) { i -> print(i) } //12345
// ^^^ just a bit less noisy than the previous call

walk1To(5) {
  i -> print(i)
} //12345
// ^^^ the difference is significant if we plan to write multiline lambdas

walk1To(5) { print(it) } //12345
// ^^^ use implicit it
```

#### Using Function References

we can take this noise reduction further if the lambdas are pass-through functions:
the lambdas passed to forEach() and to walk1To() didn’t really do anything with their parameters except to pass them through to some other function

```
({x -> someMethod(x) })
```
We can replace it with this:
```
(::someMethod)
```
If the pass-through is to another lambda, then we don’t need the ::.
```kotlin
fun walk1To(n: Int, action: (Int) -> Unit) = (1..n).forEach(action)

walk1To(5) { i -> print(i) }
walk1To(5, ::print)

walk1To(5) { i -> System.out.println(i) }
walk1To(5, System.out::println)
```

with a function reference on this:
```kotlin
fun send(n: Int) = println(n) 

walk1To(5) { i -> send(i) }
walk1To(5, this::send)
```

with a function reference on a singleton:
```kotlin
object Terminal {
  fun write(value: Int) = println(value)
}

walk1To(5) { i -> Terminal.write(i) } 
walk1To(5, Terminal::write)
```

#### Function Returning Functions

```kotlin
val names = listOf("Pam", "Pat", "Paul", "Paula")

println(names.find { name -> name.length == 5 }) //Paula 
println(names.find { name -> name.length == 4 }) //Paul
```

We can refactor the code to create a function that will take the length as a parameter and return a lambda, a predicate, as the result:
```kotlin
fun predicateOfLength(length: Int): (String) -> Boolean { 
  return { input: String -> input.length == length }
}

println(names.find(predicateOfLength(5))) //Paula 
println(names.find(predicateOfLength(4))) //Paul
```

In the function, we specified the return type of predicateOfLength(). We may also ask Kotlin to infer the type.
That’s only possible if the function is short, with a non-block body:
```kotlin
fun predicateOfLength(length: Int) = { input: String -> input.length == length }

println(names.find(predicateOfLength(5))) //Paula 
println(names.find(predicateOfLength(4))) //Paul
```

 - Always specify return type for block-body functions, 
 - and use type inference only for functions with a non-block body. 

### 10.3 Lambdas and Anonymous Functions <a name="lambdas_and_anonymous_functions"></a>

Lambdas are often passed as arguments to functions, but if the same lambda is needed on multiple calls, that may lead to code duplication.
We can avoid that in a couple of ways. One is to store a lambda into a variable for reuse.

When a lambda is passed as argument to a function, Kotlin can infer the type of the parameters. 
But if we define a variable to store a lambda, Kotlin doesn’t have any context about the types. 
```kotlin
val checkLength5 = { name: String -> name.length == 5 }
//                         ^^^ we need to provide sufficient type information

println(names.find(checkLength5)) //Paula
```

Alternatively, we may ask Kotlin to infer in the opposite direction:
```kotlin
val checkLength5: (String) -> Boolean = { name -> name.length == 5 }
//                ^^^ we can specify the type of the variable and ask it to infer the type of the lambda’s parameter
val checkLength5: (String) -> Boolean = { name: String -> name.length == 5 } //Redundant, Not Preferred
```

we may create anonymous functions instead of lambdas:
An anonymous function is written like a regular function, so the rules of specifying the return type
— no type inference for block-body, return required for block-body, and so on — 
apply, with one difference: the function doesn’t have a name.
```kotlin
val checkLength5 = fun(name: String): Boolean { return name.length == 5 }
```

Instead of storing an anonymous function in a variable, you may use it directly as an argument in a function call, in place of a lambda:
```kotlin
names.find(fun(name: String): Boolean { return name.length == 5 }) // a lot more verbose than passing a lambda
```

Some restrictions apply when an anonymous function is used instead of a lambda:
 - The return keyword is required for block-body anonymous functions that return a value.
 - The return will always return from the anonymous function, and not from the encompassing function
 - anonymous functions are required to be within the ()
   ```kotlin
   names.find { fun(name: String): Boolean { return name.length == 5 } } //ERROR
   ```

Prefer lambdas over anonymous functions where possible, and use anonymous functions selectively only in those rare occasions when they are suitable instead of lambdas.

### 10.4 Closures and Lexical Scoping <a name="closures_and_lexical_scoping"></a>

A lambda is stateless; the output depends on the values of the input parameters:
```kotlin
val doubleIt = { e: Int -> e * 2 }
```

Sometimes we want to depend on external state. Such a lambda is called a closure — that’s because it closes over the defining scope to bind to the properties and methods that aren’t local. 
```kotlin
val factor = 2

val doubleIt = { e: Int -> e * factor }
//                             ^^^ the variable or property factor isn’t local
```
The compiler has to look in the defining scope of the closure—that is, where the body of the closure is defined—for that variable. 
If it doesn’t find it there, the compiler will have to continue the search in the defining scope of the defining scope, and so on. 
This is called lexical scoping.

Mutability is taboo in functional programming. However, Kotlin doesn’t complain if from within a closure we read or modify a mutable local variable.
```kotlin
var factor = 2

val doubled = listOf(1, 2).map { it * factor }
val doubledAlso = sequenceOf(1, 2).map { it * factor } 

factor = 0

doubled.forEach { println(it) }
// 2 
// 4
doubledAlso.forEach { println(it) } 
// 0 
// 0
// because of the different behaviors of list vs. sequence (lazy evaluation)
```
Using mutable variables from within a closure is often a source of error and should be avoided. Keep closure as pure functions to avoid confusion and to minimize errors.

### 10.5 Non-Local and Labeled return <a name="non-local_and_labeled_return"></a>

By default lambdas aren’t allowed to have the return keyword, even if they return a value. This is a significant difference between lambdas and anonymous functions.

#### return Not Allowed by Default

```kotlin
fun invokeWith(n: Int, action: (Int) -> Unit) { 
  println("enter invokeWith $n")
  action(n)
  println("exit invokeWith $n")
}

fun caller() {
  (1..3).forEach { i ->
    invokeWith(i) {
      println("enter for $it")

      if (it == 2) { return } //ERROR, return is not allowed here
      //             ^^^ Kotlin doesn’t know if we mean 
      //             (1) to exit the immediate lambda and continue executing code within invokeWith() 
      //                 right after the call to action(n), or 
      //             (2) we mean to exit the for loop, or 
      //             (3) exit the function caller()

      println("exit for $it")
    }
  }

  println("end of caller")
}

caller()
println("after return from caller")
```

#### Labeled return

If you want to exit the current lambda immediately, then you may use a labeled return, 
that is return@label where label is some label you can create using the syntax label@.
```kotlin
fun invokeWith(n: Int, action: (Int) -> Unit) { 
  println("enter invokeWith $n")
  action(n)
  println("exit invokeWith $n")
}

fun caller() {
  (1..3).forEach { i ->
    invokeWith(i) here@ {
      println("enter for $it")

      if (it == 2) { return@here }

      println("exit for $it")
    }
  }

  println("end of caller")
}

caller()
println("after return from caller")

// enter invokeWith 1
// enter for 1
// exit for 1
// exit invokeWith 1
// enter invokeWith 2
// enter for 2
// exit invokeWith 2
// enter invokeWith 3
// enter for 3
// exit for 3
// exit invokeWith 3
// end of caller
// after return from caller
```
The behavior here is equivalent to the continue statements used in imperative-style loops where the control skips to the end of the loop.

Instead of using an explicit label, like @here, we can use an implicit label that is the name of the function to which the lambda is passed.
We can thus replace return@here with return@invokeWith and remove the label here@.
Even though Kotlin permits the use of method names as labels, prefer explicit labels instead. 

The compiler won’t permit labeled return to arbitrary outer scope — you can only return out of the current encompassing lambda.
If you want to exit out of the current function being defined, then you can’t do that by default, but you can if the function to which the lambda is passed is inlined.
```kotlin
inline fun invokeWith(n: Int, action: (Int) -> Unit) {
// ^^^ should be inline
  println("enter invokeWith $n")
  action(n)
  println("exit invokeWith $n")
}

fun caller() {
  (1..3).forEach here@{ i ->
    //           ^^^ invokeWith is an inline function -> the label is in the same scope
    invokeWith(i) {
      println("enter for $it")

      if (it == 2) { return@here }

      println("exit for $it")
    }
  }

  println("end of caller")
}

caller()
println("after return from caller")

// enter invokeWith 1
// enter for 1
// exit for 1
// exit invokeWith 1
// enter invokeWith 2
// enter for 2

// enter invokeWith 3
// enter for 3
// exit for 3
// exit invokeWith 3
// end of caller
// after return from caller
```

#### Non-Local return

Non-local return is useful to break out of the current function that’s being implemented

```kotlin
fun invokeWith(n: Int, action: (Int) -> Unit) { 
  println("enter invokeWith $n")
  action(n)
  println("exit invokeWith $n")
}

fun caller() {
  (1..3).forEach { i ->

    println("in forEach for $i") 
    if (i == 2) { return }
    //            ^^^ non-local return

    invokeWith(i) here@ {
      println("enter for $it")

      if (it == 2) { return@here }

      println("exit for $it")
    }
  }

  println("end of caller")
}

caller()
println("after return from caller")

// in forEach for 1
// enter invokeWith 1
// enter for 1
// exit for 1
// exit invokeWith 1
// in forEach for 2
// after return from caller
```

Now to the question: Why did Kotlin disallow return, without label, of course, within the lambda we passed to invokeWith(), 
but didn’t flinch at the return within the lambda passed to forEach()?

We defined invokeWith() as the following:
```
fun invokeWith(n: Int, action: (Int) -> Unit) {
```
On the other hand, forEach() is defined, in the Kotlin standard library, like this:
```
inline fun <T> Iterable<T>.forEach(action: (T) -> Unit): Unit {
```
The answer lies in the keyword inline. 

### 10.6 Inlining Functions with Lambdas <a name="inlining_functions_with_lambdas"></a>

Lambdas are elegant, and it’s convenient to pass functions to functions, but there’s a catch: performance.
Kotlin provides the inline keyword 
- to eliminate the call overhead in order to improve performance, 
- to provide non-local control flow,
- and to pass reified type parameters

In some situations — such as when a higher-order function contains a loop and excessively calls a lambda expression 
from within the loop, for example — the overhead of calling the higher-order function and the lambdas within it may 
be measurable. 
In that case, and only in that case, measure the performance first, 
and then consider these added complexities to improve the performance where necessary.

#### No inline Optimization by Default

```kotlin
fun invokeTwo( 
  n: Int,
  action1: (Int) -> Unit, 
  action2: (Int) -> Unit 
  ): (Int) -> Unit {

  println("enter invokeTwo $n")

  action1(n)
  action2(n)

  println("exit invokeTwo $n")

  return { _: Int -> println("lambda returned from invokeTwo") } 
}

fun callInvokeTwo() {
  invokeTwo(1, { i -> report(i) }, { i -> report(i) })
}

callInvokeTwo()

fun report(n: Int) { 
  println("")
  print("called with $n, ")

  val stackTrace = RuntimeException().getStackTrace()

  println("Stack depth: ${stackTrace.size}") 
  println("Partial listing of the stack:")
  stackTrace.take(5).forEach(::println)
}

// enter invokeTwo 1

// called with 1, Stack depth: 36
// Partial listing of the stack:
// Noinline.report(noinline.kts:27)
// Noinline$callInvokeTwo$1.invoke(noinline.kts:18)
// Noinline$callInvokeTwo$1.invoke(noinline.kts:1)
// Noinline.invokeTwo(noinline.kts:9)
// Noinline.callInvokeTwo(noinline.kts:18)

// called with 1, Stack depth: 36
// Partial listing of the stack:
// Noinline.report(noinline.kts:27)
// Noinline$callInvokeTwo$2.invoke(noinline.kts:18)
// Noinline$callInvokeTwo$2.invoke(noinline.kts:1)
// Noinline.invokeTwo(noinline.kts:10)
// Noinline.callInvokeTwo(noinline.kts:18)

// exit invokeTwo 1
```
The function reports the number of levels of call stack below the current execution of report(): 36.

#### Inline Optimization

If a function is marked as inline, then instead of making a call to the function, 
the bytecode for that function will be placed inline at the call location. 
This will eliminate the function call overhead, but the bytecode will be larger since the inlining will happen
 at every location where the function is called.

Let’s optimize the invokeTwo() function using inline:
```kotlin
inline fun invokeTwo( 
  n: Int,
  action1: (Int) -> Unit, 
  action2: (Int) -> Unit 
  ): (Int) -> Unit {

  println("enter invokeTwo $n")

  action1(n)
  action2(n)

  println("exit invokeTwo $n")

  return { _: Int -> println("lambda returned from invokeTwo") } 
}

fun callInvokeTwo() {
  invokeTwo(1, { i -> report(i) }, { i -> report(i) })
}

callInvokeTwo()

fun report(n: Int) { 
  println("")
  print("called with $n, ")

  val stackTrace = RuntimeException().getStackTrace()

  println("Stack depth: ${stackTrace.size}") 
  println("Partial listing of the stack:")
  stackTrace.take(5).forEach(::println)
}

// enter invokeTwo 1

// called with 1, Stack depth: 33
// Partial listing of the stack:
// Inlineoptimization.report(noinline.kts:27)
// Inlineoptimization.callInvokeTwo(noinline.kts:18)
// Inlineoptimization.<init>(noinline.kts:21)
// java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
// java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)

// called with 1, Stack depth: 33
// Partial listing of the stack:
// Inlineoptimization.report(noinline.kts:27)
// Inlineoptimization.callInvokeTwo(noinline.kts:18)
// Inlineoptimization.<init>(noinline.kts:21)
// java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
// java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)

// exit invokeTwo 1
```
The three levels of call stack we are gone. Stack depth: 33

By using the inline annotation you can eliminate the call overhead. But if the function being inlined is very large and 
if it’s called from a lot of different places, the bytecode generated may be much larger than when inline isn’t used. 
Measure and optimize—don’t optimize blindly.

#### Selective noinline of Parameter

If for some reason we don’t want to optimize the call to a lambda, 
we can ask that optimization to be eliminated by marking the lambda parameter as noinline.
We can use that keyword only on parameters when the function itself is marked as inline.

```kotlin
inline fun invokeTwo( 
  n: Int,
  action1: (Int) -> Unit, 
  noinline action2: (Int) -> Unit 
  ): (Int) -> Unit {

  println("enter invokeTwo $n")

  action1(n)
  action2(n)

  println("exit invokeTwo $n")

  return { _: Int -> println("lambda returned from invokeTwo") } 
}

fun callInvokeTwo() {
  invokeTwo(1, { i -> report(i) }, { i -> report(i) })
}

callInvokeTwo()

fun report(n: Int) { 
  println("")
  print("called with $n, ")

  val stackTrace = RuntimeException().getStackTrace()

  println("Stack depth: ${stackTrace.size}") 
  println("Partial listing of the stack:")
  stackTrace.take(5).forEach(::println)
}

// enter invokeTwo 1

// called with 1, Stack depth: 33
// Partial listing of the stack:
// Noinlineoptimization.report(noinline.kts:27)
// Noinlineoptimization.callInvokeTwo(noinline.kts:18)
// Noinlineoptimization.<init>(noinline.kts:21)
// java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
// java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)

// called with 1, Stack depth: 36
// Partial listing of the stack:
// Noinlineoptimization.report(noinline.kts:27)
// Noinlineoptimization$callInvokeTwo$2.invoke(noinline.kts:18)
// Noinlineoptimization$callInvokeTwo$2.invoke(noinline.kts:1)
// Noinlineoptimization.callInvokeTwo(noinline.kts:37)
// Noinlineoptimization.callInvokeTwo(noinline.kts:18)
// Noinlineoptimization.<init>(noinline.kts:21)

// exit invokeTwo 1
```
Kotlin won’t allow us to hold a reference to action1 since it’s inlined, 
but we may create a reference to action2 within the invokeTwo() function,
 if we like, since action2 is defined as noinline.

#### Non-Local return Permitted in Inlined Lambdas

In the previous example, the invokeTwo() function has the inline annotation and, as a result, the first lambda action1() will also be inlined. 
However, the second lambda action2() is marked as noinline. Thus, Kotlin will permit non-local return and labeled return 
from within the lambda passed as an argument for the action1 parameter. 
But, from within the lambda passed as the argument for the action2 parameter, only labeled return is permitted.
This is because, whereas an inlined lambda expands within a function, the non-inlined lambda will be a separate function call.

```kotlin
inline fun invokeTwo( 
  n: Int,
  action1: (Int) -> Unit, 
  noinline action2: (Int) -> Unit 
  ): (Int) -> Unit {

  println("enter invokeTwo $n")

  action1(n)
  action2(n)

  println("exit invokeTwo $n")

  return { _: Int -> println("lambda returned from invokeTwo") } 
}

fun callInvokeTwo() {
  invokeTwo(1, { i ->
      if (i == 1) { return }
      report(i) 
    }, { i ->
      //if (i == 2) { return }| //ERROR, return not allowed here
      report(i) 
    })
}

callInvokeTwo()

fun report(n: Int) { 
  println("")
  print("called with $n, ")

  val stackTrace = RuntimeException().getStackTrace()

  println("Stack depth: ${stackTrace.size}") 
  println("Partial listing of the stack:")
  stackTrace.take(3).forEach(::println)
}

// enter invokeTwo 1
```
When using inline you can not only eliminate the function call overhead, but also gain the ability to place a non-local return from within the inlined lambdas.

#### crossinline Parameters

If a function is marked inline, then the lambda parameters not marked with noinline are automatically considered to be inlined.
At the location where a lambda is invoked within the function, the body of the lambda will be inlined. 
But there’s one catch. What if instead of calling the given lambda, the function passes on the lambda to yet another function, or back to the caller?
```kotlin
inline fun invokeTwo( 
  n: Int,
  action1: (Int) -> Unit, 
  action2: (Int) -> Unit //ERROR
  ): (Int) -> Unit {

  println("enter invokeTwo $n")

  action1(n)

  println("exit invokeTwo $n")

  return { input: Int -> action2(input) }
  //                     ^^^ can't be inlined -> ERROR^^^
  //                     resolve it with:
  //                     (1) mark action2 as noinline
  //                     (2) mark action2 as crossinline
}
```

You can ask the function to pass on your request for inlining across to the caller; that’s what crossinline is for.

- inline performs inline optimization, to remove function call overhead.
- crossinline also performs inline optimization, not within the function to which the lambda is passed, but wherever it is eventually called.
- Only lambdas passed for parameters not marked noinline or crossinline can have non-local return.

#### Good Practices for inline and returns

good practices related to returns and inline:
- Unlabeled return is always a return from a function and not from a lambda.
- Unlabeled returns are not permitted in non-inlined lambdas.
- Function names are the default labels, but don’t rely on them, always provide custom names if you choose to use labeled returns.
- Measure performance before deciding to optimize code; this is true in general, and in particular for code that uses lambdas.
- Use inline only when you see measurable performance improvements.

### 10.7 Wrapping Up <a name="wrapping_up"></a>

 - Lambdas are functions with no name and may be easily passed around as arguments to functions.
 - Where a lambda is expected, you may also pass function references to reuse functions or methods.
 - Whereas lambdas are stateless, closures carry state.
   - avoid messing with mutable state as that may lead to potential errors and confusing behavior in code.
 - Kotlin has strict rules about using return from within lambdas
   - it permits the use of labeled returns, and non-local returns under special situations:
     - return is not allowed by default within lambdas.
     - You may use a labeled return to step out of the encompassing lambda.
     - Use of non-local return to exit from the encompassing function being defined is possible only if the function to which the lambda is passed is defined with inline.
 - Kotlin provides a facility to eliminate function and lambda call overhead with the help of the inline keyword.
