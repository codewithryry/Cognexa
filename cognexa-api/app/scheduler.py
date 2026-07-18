import heapq
import itertools
import queue
import threading

# Plan-based priority scheduling shared by document indexing and chat retrieval.
# Lower number = served first. This is what makes the "priority indexing &
# faster retrieval" pricing claim real instead of just copy: under concurrent
# load, paid-plan work is dequeued/granted a slot ahead of Community work.
PLAN_PRIORITY = {
    "team": 0,
    "pro": 1,
    "community": 2,
}


def plan_priority(plan: str) -> int:
    return PLAN_PRIORITY.get(plan, PLAN_PRIORITY["community"])


class PriorityWorkerPool:
    """Background workers that run submitted jobs in priority order.

    Used for document indexing: uploads enqueue a job instead of blocking the
    request, and higher-plan jobs are dequeued before lower-plan ones whenever
    more than one is waiting.
    """

    def __init__(self, num_workers=3):
        self._queue = queue.PriorityQueue()
        self._counter = itertools.count()
        for _ in range(num_workers):
            thread = threading.Thread(target=self._worker_loop, daemon=True)
            thread.start()

    def submit(self, priority, fn, *args, **kwargs):
        seq = next(self._counter)
        self._queue.put((priority, seq, fn, args, kwargs))

    def _worker_loop(self):
        while True:
            priority, seq, fn, args, kwargs = self._queue.get()
            try:
                fn(*args, **kwargs)
            except Exception:
                pass
            finally:
                self._queue.task_done()


class PrioritySlotGate:
    """Limits concurrent access to `capacity` slots, granting waiters in
    priority order rather than FIFO order.

    Used for chat retrieval/generation: when more requests are in flight than
    available slots, paid-plan requests are granted a slot ahead of
    Community requests that have been waiting longer.
    """

    def __init__(self, capacity=2):
        self._capacity = capacity
        self._in_use = 0
        self._counter = itertools.count()
        self._waiters = []
        self._lock = threading.Lock()

    def acquire(self, priority):
        with self._lock:
            if self._in_use < self._capacity:
                self._in_use += 1
                return
            event = threading.Event()
            seq = next(self._counter)
            heapq.heappush(self._waiters, (priority, seq, event))
        event.wait()

    def release(self):
        with self._lock:
            if self._waiters:
                _, _, event = heapq.heappop(self._waiters)
                event.set()
            else:
                self._in_use -= 1

    def __call__(self, priority):
        return _SlotContext(self, priority)


class _SlotContext:
    def __init__(self, gate, priority):
        self._gate = gate
        self._priority = priority

    def __enter__(self):
        self._gate.acquire(self._priority)
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self._gate.release()
        return False
