
# Table of contents

15. [Exploring Coroutines](#exploring_coroutines)
   1. [Coroutines and Concurrency](#coroutines_and_concurrency)
   2. [Running Concurrently Using Coroutines](#running_concurrently_using_coroutines)
   3. [Coroutine Context and Threads](#coroutine_context_and_threads)
   4. [Debugging Coroutines](#debugging_coroutines)
   5. [async and await](#non-async_and_await)
   6. [A Peek at Continuations](#peek_at_continuations)
   7. [Creating Infinite Sequences](#creating_infinite_sequence)
   8. [Wrapping Up](#wrapping_up)

## 15. Exploring Coroutines <a name="exploring_coroutines"></a>

### 15.1 Coroutines and Concurrency <a name="coroutines_and_concurrency"></a>

- Sequential execution: Execute task one after the other
- Non-sequential: 
  - Parallel: When two tasks run at the same time on different threads.
  - Concurrent: When two tasks run on the same thread alternating between them.

#### Coroutines as Cooperating Functions:

Subroutines are more common than coroutines in general-purpose programming. 
Subroutines are functions that run to completion before returning to
the caller. Subroutines don’t maintain any state between calls. 
Coroutines are also functions but behave differently than subroutines. 
Unlike subroutines, which have a single point of entry, coroutines have 
multiple points of entry. Additionally, coroutines may remember state between calls.

#### Why coroutines

Tasks that are long running or very resource consuming can block the main thread and 
make your app/website unresponsive. Through coroutines you can chunk your tasks into 
smaller pieces and even delegate them to worker threads. Normally running a task in
coroutines does not automatically mean new thread, only that the app is responsive.
In fact, it’s a really good idea to run coroutines in the main thread when launching 
a coroutine in response to a UI event — that way, if you don’t end up doing a 
long running task that requires main-safety, the result can be available in the 
very next frame for the user.

The way Java (and most other programming languages) solved waiting for tasks to complete 
was to use callbacks. This quickly grows into callback hell. Another possibility is RxJava,
which is better but requires to learn a completely new API. Coroutines solve both problems 
as they are integrated into the language.

### 15.2 Running Concurrently Using Coroutines <a name="running_concurrently_using_coroutines"></a>

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

##### Extra
You can't simply run coroutines from any function. There has to be an entry point to
coroutines, which in this case the runBlocking function. Ironically it is discouraged
to use, because one of the cornerstones of coroutines is to make the main function unblocked
and runBlocking does exactly the opposite. This here is just for educational purposes (I guess).
Normally the entrypoint to coroutines is the launch function, that we use in the book too.

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

### 15.3 Coroutine Context and Threads <a name="coroutine_context_and_threads"></a>

The call to the launch() and runBlocking() functions resulted in the coroutines
executing in the same thread as the caller’s coroutine scope.

#####

Coroutines must run in a CoroutineScope, which is used to keep track of 
all the coroutines, and it can cancel all of the coroutines started in 
it. When a scope cancels, all of its coroutines cancel. CoroutinesScope 
propagates itself — new coroutines started by your coroutines will have 
the same scope.

Coroutine scope consists of all the machinery required to run coroutine, for 
example, it knows where (on which thread) to run coroutine and coroutine 
builders are used to create a new coroutine.

public interface CoroutineScope {
    public val coroutineContext: CoroutineContext
}

Job — controls the lifecycle of the coroutine.
CoroutineDispatcher (default is Dispatchers.Default) — dispatches work to the appropriate thread.
CoroutineName (optional, default is “coroutine”) — name of the coroutine, useful for debugging.
CoroutineExceptionHandler (optional) — handles uncaught exceptions.

Coroutine context is immutable, but you can add elements to a context 
using plus operator, just like you add elements to a set, producing a new context instance.
A coroutine itself is represented by a Job.

The important thing you need to know is that whenever a new coroutine scope 
is created, a new job gets created and gets associated with it.

The difference between a context and a scope is in their intended purpose. I swear I tried to understand 
this but it's difficult: 
https://elizarov.medium.com/coroutine-context-and-scope-c8b255d59055

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

| Dispatcher         | Description | Uses                         |
| -------------------| ----------- | ---------------------------- |
|Dispatchers.Main    | Main thread | - Calling suspended functions<br>- Call UI functions|
|Dispatchers.IO      | Disk and netowrk IO| - Db, other netowrk calls<br> - File IO|
|Dispatchers.Default | CPU instensive work  | - Sorting list/other alg<br>- Parsing JSON|

Reasons for CPU-bpund IO and default: https://gist.github.com/djspiewak/46b543800958cf61af6efa8e072bfd5c

Coroutines can suspend themselves, and the dispatcher is the thing that knows how to resume them.


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

The question here is whether did withContext() really change the
context of the currently executing coroutine or did it merely create an
entirely new coroutine?

### 15.4 Debugging Coroutines <a name="debugging_coroutines"></a>

Kotlin provides a command-line option -Dkotlinx.coroutines.debug to display the
details of the coroutine executing a function.
```
starting in Thread Thread[main @coroutine#1,5,main]
start task1 in Thread Thread[DefaultDispatcher-worker-1 @coroutine#1,5,main]
end task1 in Thread Thread[DefaultDispatcher-worker-3 @coroutine#1,5,main]
ending in Thread Thread[main @coroutine#1,5,main]
start task2 in Thread Thread[main @coroutine#2,5,main]
end task2 in Thread Thread[main @coroutine#2,5,main]
```

We can assign a name by passing an instance of CoroutineName() to runBlocking()
and launch(). This helps with identifying the coroutine we want to debug.

```kotlin
runBlocking(CoroutineName("top")) {
   println("running in Thread ${Thread.currentThread()}")
   withContext(Dispatchers.Default) { task1() }
   launch(Dispatchers.Default + CoroutineName("task runner")) { task2() }
   println("running in Thread ${Thread.currentThread()}")
}
```
```
running in Thread Thread[main @top#1,5,main]
start task1 in Thread Thread[DefaultDispatcher-worker-1 @top#1,5,main]
end task1 in Thread Thread[DefaultDispatcher-worker-3 @top#1,5,main]
start task2 in Thread Thread[DefaultDispatcher-worker-3 @task runner#2,5,main]
end task2 in Thread Thread[DefaultDispatcher-worker-3 @task runner#2,5,main]
running in Thread Thread[main @top#1,5,main]
```

### 15.5 async and await <a name="async_and_await"></a>

If you want to execute a task asynchronously and get the response, 
then use async() instead of launch(). The async() function takes the 
same parameters as launch(). The difference, though, is that async() returns a
Deferred<T> future object which has an await() method, among other methods,
to check the status of the coroutine, cancel, and so on. A call to await() will
block the flow of execution but not the thread of execution. Thus, the code
in the caller and the code within the coroutine started by async() can run
concurrently. The call to await() will eventually return the result of the coroutine
started using async(). If the coroutine started using async() throws an exception,
then that exception will be propagated to the caller through the call to await().

```kotlin
import kotlinx.coroutines.*

runBlocking {
   val count: Deferred<Int> = async(Dispatchers.Default) {
   println("fetching in ${Thread.currentThread()}")
   Runtime.getRuntime().availableProcessors()
}

println("Called the function in ${Thread.currentThread()}")

println("Number of cores is ${count.await()}")
}
```

```
Called the function in Thread[main,5,main]
fetching in Thread[DefaultDispatcher-worker-1,5,main]
Number of cores is 8
```

### 15.6 A Peek at Continuations <a name="peek_at_continuations"></a>

We are going to examine Java bytecode to see how the context and all the data
is kept between suspension and thread changes.

```kotlin
import kotlinx.coroutines.*

class Compute {
   fun compute1(n: Long): Long = n * 2
   suspend fun compute2(n: Long): Long {
      val factor = 2
      println("$n received : Thread: ${Thread.currentThread()}")
      delay(n * 1000)
      val result = n * factor
      println("$n, returning $result: Thread: ${Thread.currentThread()}")
      return result
   }
}

fun main() = runBlocking<Unit> {
   val compute = Compute()
   launch(Dispatchers.Default) {
      compute.compute2(2)
   }
   launch(Dispatchers.Default) {
      compute.compute2(1)
   }
}
```
We assign a single expression function to the main() function with a call to runBlock-
ing<Unit>. So far we used only runBlocking() without the parametric Unit, but since
the return type of main() is Unit, we have to convey that the call to runBlocking() is
returning the same.

```
2 received : Thread: Thread[DefaultDispatcher-worker-1,5,main]
1 received : Thread: Thread[DefaultDispatcher-worker-2,5,main]
1, returning 2: Thread: Thread[DefaultDispatcher-worker-2,5,main]
2, returning 4: Thread: Thread[DefaultDispatcher-worker-4,5,main]
```

The Java bytecode that is interesting for our purposes:
```
public final long compute1(long);
public final java.lang.Object compute2(long,
   kotlin.coroutines.Continuation<? super java.lang.Long>);
```
Even though in the source code compute2()
only took one parameter, in the compiled version we see that it takes two
parameters: long and Continuation<?superLong>. Furthermore, it returns Object instead
of long. The Continuation encapsulates the results of the partial execution of the
function so that the result can be delivered to the caller using the Continuation
callback.

### 15.7 Creating Infinite Sequences <a name="creating_infinite_sequence"></a>

A function may create a value in the series and yield it to the
code that is expecting the value. Upon consuming the value, the calling code
can come back asking for the next value in the series. These steps can continue
in tandem until either the code that produces the series exits or the caller doesn’t
ask for another value in the series.

```kotlin
fun primes(start: Int): Sequence<Int> = sequence {
   println("Starting to look")
   var index = start
   while (true) {
      if (index > 1 && (2 until index).none { i -> index % i == 0 }) {
         yield(index)
         println("Generating next after $index")
      }
      index++
   }
}

for (prime in primes(start = 17)) {
   println("Received $prime")
   if (prime > 30) break
}
```
Within the lambda passed to the sequence() function, we look for the next prime
value and yield it using a yield() method—this one is part of the standard
library and is different from the yield() we used from the kotlinx.coroutines library.

```
Starting to look
Received 17
Generating next after 17
Received 19
...
```

#### Using the iterator function
```kotlin
operator fun ClosedRange<String>.iterator() = object: Iterator<String> {
   private val next = StringBuilder(start)
   private val last = endInclusive
   override fun hasNext() =
      last >= next.toString() && last.length >= next.length
   override fun next(): String {
      val result = next.toString()
      val lastCharacter = next.last()
      if (lastCharacter < Char.MAX_VALUE) {
         next.setCharAt(next.length - 1, lastCharacter + 1)
      } else {
      next.append(Char.MIN_VALUE)
      }
      return result
   }
}
```


```kotlin
operator fun ClosedRange<String>.iterator(): Iterator<String> = iterator {
   val next = StringBuilder(start)
   val last = endInclusive
   while (last >= next.toString() && last.length >= next.length) {
      val result = next.toString()
      val lastCharacter = next.last()
      if (lastCharacter < Char.MAX_VALUE) {
         next.setCharAt(next.length - 1, lastCharacter + 1)
      } else {
         next.append(Char.MIN_VALUE)
      }
      yield(result)
   }
}
```

### 15. 8 Wrapping Up <a name="wrapping_up"></a>
- functions with multiple entry points
- carry state between invocations
- can call into each other and resume execution from where they left off
- may yield the flow of control to other pending tasks
- can change the thread of execution of coroutines
- using async() and await(), perform tasks in parallel and receive the result in the future

My questions:
- When a coroutine is suspended, how is it decided which is the most important next job that has to run?

### extra sources not mentioned yet:

https://www.youtube.com/watch?v=YrrUCSi72E8

https://medium.com/swlh/everything-you-need-to-know-about-kotlin-coroutines-b3d94f2bc982#id_token=eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc3NDU3MzIxOGM2ZjZhMmZlNTBlMjlhY2JjNjg2NDMyODYzZmM5YzMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2MTgxNTcxNTAsImF1ZCI6IjIxNjI5NjAzNTgzNC1rMWs2cWUwNjBzMnRwMmEyamFtNGxqZGNtczAwc3R0Zy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExMDg3ODU5OTA5NzUwNDQyNDcwOSIsImVtYWlsIjoibWF0eWFzbWlrbG9zQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhenAiOiIyMTYyOTYwMzU4MzQtazFrNnFlMDYwczJ0cDJhMmphbTRsamRjbXMwMHN0dGcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJuYW1lIjoiTWF0eWFzIE1pa2xvcyIsInBpY3R1cmUiOiJodHRwczovL2xoNC5nb29nbGV1c2VyY29udGVudC5jb20vLS1yb0Zna19MMkx3L0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y25iSGJFT25ETWlMMExnVENYQXVPc0dMTFp1S2cvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6Ik1hdHlhcyIsImZhbWlseV9uYW1lIjoiTWlrbG9zIiwiaWF0IjoxNjE4MTU3NDUwLCJleHAiOjE2MTgxNjEwNTAsImp0aSI6ImE0YTdiOWU3M2JhNTQ2M2NiMjVmZGQ0M2E1NmQ2MzY0NWQ0NWNiNjcifQ.ACOBMhHLNHVROvI0xGbXWQ2RmPkXbUAF9UupCaJVi1WYz_E3JdZdTVW1HHnEgdDFpr-tLEN3BGVh_nhHhHjkzIjvZqXr3Ib-UXB-RuoBpvRDh4dChloaJVkcn4fZPK4VdnCY0emUcds93W0MJ0U802pcT0hmHdxvALM5fJV7hy-Dpxb8yFvRnjNE0zR-843drZ18Z2g3rbxWp3Dv9eUpEW4Bq5IBN7QkcGw2p4SOvMBn_whFLYs1bxUsf67CqUr6jikEfSiqrX_Xku0cGX3e37aSMy53HHYNyRrZMtz3hhgU2LmIfjBqpIRo7mI4ZhsPhYupauBgLwbXrBKg8CYxIA
