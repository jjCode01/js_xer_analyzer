

function findTaskChanges(proj1, proj2){
    let changes = {
        addedTasks: [],
        deletedTasks: [],
        names: [],
        durations: [],
        calendars: [],
        actualStarts: [],
        actualFinishes: [],
    }

    currTasks = {}
    prevTasks = {}
    proj1.tasks.forEach(t => currTasks[t.task_code] = t)
    proj2.tasks.forEach(t => prevTasks[t.task_code] = t)

    // Find task changes
    Object.entries(currTasks).forEach(([key, task]) => {
        // Find added tasks
        if (!prevTasks[key]){changes.addedTasks.push(task)}
        else{
            const prev = prevTasks[key]

            // Find Name Change
            if (task.task_name != prev.task_name){
                changes.names.push({current: task, previous: prev})
                // console.log(`Task Name Change: ${task.task_code} - ${task.task_name} <==> ${prev.task_name}`)
            }

            // Find orig duration change
            if (task.target_drtn_hr_cnt != prev.target_drtn_hr_cnt){
                changes.durations.push({current: task, previous: prev})
                // console.log(`Original Duration Change: ${task.task_code} - ${task.task_name} | ${task.target_drtn_hr_cnt / 8} <==> ${prev.target_drtn_hr_cnt / 8}`)
            }

            // Find Calendar assignment changes
            if (task.calendar.clndr_name != prev.calendar.clndr_name){
                changes.calendars.push({current: task, previous: prev})
                // console.log(`Calendar Change: ${task.task_code} - ${task.task_name} | ${task.calendar.clndr_name} <==> ${prev.calendar.clndr_name}`)
            }

            // Find Actual Start changes
            if (!task.notStarted && !prev.notStarted) {
                if (formatDate(task.start) != formatDate(prev.start)) {
                    changes.actualStarts.push({current: task, previous: prev})
                    // console.log(`Actual Start Change: ${task.task_code} - ${task.task_name} | ${formatDate(task.start)} <==> ${formatDate(prev.start)}`)
                }
            }

            // Find Actual Finish changes
            if (task.completed && prev.completed) {
                if (formatDate(task.finish) != formatDate(prev.finish)) {
                    changes.actualFinishes.push({current: task, previous: prev})
                    // console.log(`Actual Finish Change: ${task.task_code} - ${task.task_name} | ${formatDate(task.finish)} <==> ${formatDate(prev.finish)}`)
                }
            }
        }
    })

    Object.entries(prevTasks).forEach(([key, val]) => {
        if (!currTasks[key]){
            changes.deletedTasks.push(val)
        }
    })

    return changes
}