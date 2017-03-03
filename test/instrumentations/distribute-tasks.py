#!/usr/bin/env python2.7
import sys
import math

node_index = int(sys.argv[1])
node_total = int(sys.argv[2])
tasks = sys.argv[3:]
task_total = len(tasks)

config = [
        tasks[i * node_total + node_index]
        for i in range(0, int(math.ceil(task_total / node_total)) + 1)
        if (i * node_total + node_index) < task_total
    ]
print ' '.join(config)
