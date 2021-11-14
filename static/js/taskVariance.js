class Change{
    constructor(desc, labels){
        this.desc = desc;
        this.labels = labels;
        this.rows = [];
    }
    add(values) {this.rows.push(values)}
}

const formatDate = dt => {
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return dt.getDate() + "-" + M[dt.getMonth()] + "-" + dt.getFullYear()
}

const findLogicChanges = (proj1, proj2) => {
    const changes = {
        addedLogic: new Change(
            "Added Relationships",
            ["Pred ID", "Pred Name", "Succ ID", "Succ Name", "Link", "Lag"]
        ),
        deletedLogic: new Change(
            "Deleted Relationships",
            ["Pred ID", "Pred Name", "Succ ID", "Succ Name", "Link", "Lag"]
        ),
        revisedLogic: new Change(
            "Revised Relationship Lags",
            ["Pred ID", "Pred Name", "Succ ID", "Succ Name", "Link", "New<br>Lag", "Old<br>Lag", "Var"]
        )

    }
    const currTasks = new Map(proj1.tasks.map(t => [t.task_id, t])) 
    const prevTasks = new Map(proj2.tasks.map(t => [t.task_id, t]))

    const setRelKey = (tasks, logic) => {
        const succID = tasks.get(logic.task_id).task_code
        const predID = tasks.get(logic.pred_task_id).task_code
        return `${succID}|${predID}|${logic.pred_type}`
    }

    const currLogic = new Map(proj1.rels.map(r => [setRelKey(currTasks, r), r]))
    const prevLogic = new Map(proj2.rels.map(r => [setRelKey(prevTasks, r), r]))

    const newLogicChange = (change, rel, tasks) => {
        const pred = tasks.get(rel.pred_task_id);
        const succ = tasks.get(rel.task_id);
        change.add([
            pred.task_code,
            pred.task_name,
            succ.task_code,
            succ.task_name,
            rel.pred_type.substring(rel.pred_type.length - 2),
            rel.lag_hr_cnt / 8
        ])
    }

    currLogic.forEach((rel, key) => {
        if (!prevLogic.has(key)) {newLogicChange(changes.addedLogic, rel, currTasks)}
        else {
            const prev = prevLogic.get(key);
            if (rel.lag != prev.lag) {
                const pred = currTasks.get(rel.pred_task_id);
                const succ = currTasks.get(rel.task_id);
                changes.revisedLogic.add([
                    pred.task_code,
                    pred.task_name,
                    succ.task_code,
                    succ.task_name,
                    rel.pred_type.substring(rel.pred_type.length - 2),
                    rel.lag_hr_cnt / 8,
                    prev.lag_hr_cnt / 8,
                    rel.lag_hr_cnt / 8 - prev.lag_hr_cnt / 8
                ])
            }
        }
    })

    // Deleted Relationships
    prevLogic.forEach((rel, key) => {
        if (!currLogic.has(key)) {newLogicChange(changes.deletedLogic, rel, prevTasks)}    
    })
    return changes
}

const findUpdates = (proj1, proj2) => {
    const updates = {
        started: new Change(
            "Activities Started",
            ["Task ID", "Task Name", "Actual Start", "Status"]
        ),
        finished: new Change(
            "Activities Finished",
            ["Task ID", "Task Name", "Actual Start", "Status"]
        ),
        remainingDuration: new Change(
            "Updated Remaining Durations",
            ["Task ID", "Task Name", "Status", "New<br>Rem Dur", "Old<br>Rem Dur", "Var"]
        ),
        physicalPercent: new Change(
            "Updated Physical Percent Complete",
            ["Task ID", "Task Name", "Status", "New<br>% Comp", "Old<br>% Comp", "Var"]
        ),
        // actualCost: new Change(
        //     "Updated Actual Cost",
        //     ["Task ID", "Task Name", "Budgeted Cost", "New Actual Cost", "Old Actual Cost", "Var"]
        // )
    }
    const currTasks = new Map(proj1.tasks.map(t => [t.task_code, t])) 
    const prevTasks = new Map(proj2.tasks.map(t => [t.task_code, t]))

    currTasks.forEach((task, key) => {
        if (prevTasks.has(key)) {
            const prev = prevTasks.get(key);
            if (!task.notStarted && prev.notStarted) {
                updates.started.add([
                    task.task_code,
                    task.task_name,
                    formatDate(task.start),
                    task.status
                ])
            }
            if (task.completed && !prev.completed) {
                updates.finished.add([
                    task.task_code,
                    task.task_name,
                    formatDate(task.finish),
                    task.status
                ])
            }
            if (task.remain_drtn_hr_cnt != prev.remain_drtn_hr_cnt) {
                // const newDurPercent = (1 - (task.remain_drtn_hr_cnt / task.target_drtn_hr_cnt)) * 100
                // const oldDurPercent = (1 - (prev.remain_drtn_hr_cnt / prev.target_drtn_hr_cnt)) * 100
                updates.remainingDuration.add([
                    task.task_code,
                    task.task_name,
                    task.status,
                    (task.remain_drtn_hr_cnt / 8),
                    (prev.remain_drtn_hr_cnt / 8),
                    (task.remain_drtn_hr_cnt / 8 - prev.remain_drtn_hr_cnt / 8).toFixed(2),
                    // `${newDurPercent}%`,
                    // `${oldDurPercent}%`,
                    // `${newDurPercent - oldDurPercent}%`
                ])
            }
            if (task.phys_complete_pct != prev.phys_complete_pct) {
                updates.physicalPercent.add([
                    task.task_code,
                    task.task_name,
                    task.status,
                    `${task.phys_complete_pct}%`,
                    `${prev.phys_complete_pct}%`,
                    `${(task.phys_complete_pct - prev.phys_complete_pct)}%`,
                ])
            }
        }
    })
    return updates
}

const findTaskChanges = (proj1, proj2) => {
    const changes = {
        addedTasks: new Change(
            "Added Activities",
            ["Task ID", "Task Name"]
        ),
        deletedTasks: new Change(
            "Deleted Activities",
            ["Task ID", "Task Name"]
        ),
        names: new Change(
            "Activity Name Changes",
            ["Task ID", "New Task Name", "Old Task Name"]
        ),
        durations: new Change(
            "Original Duration Changes",
            ["Task ID", "Task Name", "New<br>Dur", "Old<br>Dur", "Var"]
        ),
        calendars: new Change(
            "Calendar Assignment Changes",
            ["Task ID", "Task Name", "New Cal", "Old Cal"]
        ),
        actualStarts: new Change(
            "Actual Start Date Changes",
            ["Task ID", "Task Name", "New Start", "Old Start"]
        ),
        actualFinishes: new Change(
            "Actual Finish Date Changes",
            ["Task ID", "Task Name", "New Finish", "Old Finish"]
        )
    }

    const currTasks = new Map(proj1.tasks.map(t => [t.task_code, t])) 
    const prevTasks = new Map(proj2.tasks.map(t => [t.task_code, t]))

    // Find task changes
    currTasks.forEach((task, key) => {
        // Find added tasks
        if (!prevTasks.has(key)) {
            changes.addedTasks.add([
                task.task_code,
                task.task_name
            ])
        }
        else {
            const prev = prevTasks.get(key)

            // Find Name Change
            if (task.task_name != prev.task_name){
                changes.names.add([
                    task.task_code,
                    task.task_name,
                    prev.task_name
                ])
            }

            // Find orig duration change
            if (task.target_drtn_hr_cnt != prev.target_drtn_hr_cnt){
                const newDur = task.target_drtn_hr_cnt / 8
                const oldDur = prev.target_drtn_hr_cnt / 8
                changes.durations.add([
                    task.task_code,
                    task.task_name,
                    newDur,
                    oldDur,
                    newDur - oldDur
                ])
            }

            // Find Calendar assignment changes
            if (task.calendar.clndr_name != prev.calendar.clndr_name){
                changes.calendars.add([
                    task.task_code,
                    task.task_name,
                    task.calendar.clndr_name,
                    prev.calendar.clndr_name
                ])
            }

            // Find Actual Start changes
            if (!task.notStarted && !prev.notStarted) {
                if (formatDate(task.start) != formatDate(prev.start)) {
                    changes.actualStarts.add([
                        task.task_code,
                        task.task_name,
                        formatDate(task.start),
                        formatDate(prev.start)
                    ])
                }
            }

            // Find Actual Finish changes
            if (task.completed && prev.completed) {
                if (formatDate(task.finish) != formatDate(prev.finish)) {
                    changes.actualFinishes.add([
                        task.task_code,
                        task.task_name,
                        formatDate(task.finish),
                        formatDate(prev.finish)
                    ])
                }
            }
        }
    })

    Object.entries(prevTasks).forEach(([key, task]) => {
        if (!currTasks[key]){
            changes.deletedTasks.add([
                task.task_code,
                task.task_name
            ])
        }
    })

    return changes
}