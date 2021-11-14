class Change{
    constructor(desc, labels){
        this.desc = desc;
        this.labels = labels;
        this.rows = [];
    }
    
    add(values) {
        this.rows.push(values)
    }
}

function findLogicChanges(proj1, proj2) {
    const changes = {

    }
    const currTasks = {}
    const prevTasks = {}

    const currTasks2 = new Map()
    proj1.tasks.forEach(t => currTasks2.set(t.task_id, t))

    proj1.tasks.forEach(t => currTasks[t.task_id] = t)
    proj2.tasks.forEach(t => prevTasks[t.task_id] = t)

    const currLogic = {}
    const prevLogic = {}

    function setRelKey(tasks, logic) {
        const succID = tasks[logic.task_id].task_code
        const predID = tasks[logic.pred_task_id].task_code
        return `${succID}|${predID}|${logic.pred_type}`
    }
    proj1.rels.forEach(r => currLogic[setRelKey(currTasks, r)] = r)
    proj2.rels.forEach(r => prevLogic[setRelKey(prevTasks, r)] = r)
}

function findTaskChanges(proj1, proj2){
    const changes = {
        addedTasks: new Change(
            desc="Added Activities",
            labels=["Task ID", "Task Name"]
        ),
        deletedTasks: new Change("Deleted Activities", ["Task ID", "Task Name"]),
        names: new Change("Activity Name Changes", ["Task ID", "New Task Name", "Old Task Name"]),
        durations: new Change("Original Duration Changes", ["Task ID", "Task Name", "New Dur", "Old Dur", "Var"]),
        calendars: new Change("Calendar Assignment Changes", ["Task ID", "Task Name", "New Cal", "Old Cal"]),
        actualStarts: new Change("Actual Start Date Changes", ["Task ID", "Task Name", "New Start", "Old Start"]),
        actualFinishes: new Change("Actual Finish Date Changes", ["Task ID", "Task Name", "New Finish", "Old Finish"])
    }

    const currTasks = new Map(proj1.tasks.map(t => [t.task_code, t])) 
    const prevTasks = new Map(proj2.tasks.map(t => [t.task_code, t]))

    // Find task changes
    currTasks.forEach((task, key) => {
        // Find added tasks
        if (!prevTasks.has(key)){changes.addedTasks.add([task.task_code, task.task_name])}
        else{
            const prev = prevTasks.get(key)
            console.log(prev)

            // Find Name Change
            if (task.task_name != prev.task_name){
                changes.names.add([task.task_code, task.task_name, prev.task_name])
            }

            // Find orig duration change
            if (task.target_drtn_hr_cnt != prev.target_drtn_hr_cnt){
                const newDur = task.target_drtn_hr_cnt / 8
                const oldDur = prev.target_drtn_hr_cnt / 8
                changes.durations.add([task.task_code, task.task_name, newDur, oldDur, newDur - oldDur])
            }

            // Find Calendar assignment changes
            if (task.calendar.clndr_name != prev.calendar.clndr_name){
                changes.calendars.add([task.task_code, task.task_name, task.calendar.clndr_name, prev.calendar.clndr_name])
            }

            // Find Actual Start changes
            if (!task.notStarted && !prev.notStarted) {
                if (formatDate(task.start) != formatDate(prev.start)) {
                    changes.actualStarts.add([task.task_code, task.task_name, formatDate(task.start), formatDate(prev.start)])
                }
            }

            // // Find Actual Finish changes
            if (task.completed && prev.completed) {
                if (formatDate(task.finish) != formatDate(prev.finish)) {
                    changes.actualFinishes.add([task.task_code, task.task_name, formatDate(task.finish), formatDate(prev.finish)])
                }
            }
        }
    })

    Object.entries(prevTasks).forEach(([key, task]) => {
        if (!currTasks[key]){
            changes.deletedTasks.add([task.task_code, task.task_name])
        }
    })

    return changes
}