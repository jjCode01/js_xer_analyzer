class Change{
    constructor(desc, labels){
        this.desc = desc;
        this.labels = labels;
        this.rows = [];
    }
    add(values) {this.rows.push(values)}
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

    const setRelKey = (tasks, logic) => {
        const succID = tasks.get(logic.task_id).task_code
        const predID = tasks.get(logic.pred_task_id).task_code
        return `${succID}|${predID}|${logic.pred_type}`
    }

    const currLogic = new Map(proj1.rels.map(r => [setRelKey(proj1.tasks, r), r]))
    const prevLogic = new Map(proj2.rels.map(r => [setRelKey(proj2.tasks, r), r]))

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
        if (!prevLogic.has(key)) {newLogicChange(changes.addedLogic, rel, proj1.tasks)}
        else {
            const prev = prevLogic.get(key);
            if (rel.lag != prev.lag) {
                const pred = proj1.tasks.get(rel.pred_task_id);
                const succ = proj1.tasks.get(rel.task_id);
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
        if (!currLogic.has(key)) {newLogicChange(changes.deletedLogic, rel, proj2.tasks)}    
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
            ["Task ID", "Task Name", "Actual Finish", "Status"]
        ),
        remainingDuration: new Change(
            "Updated Remaining Durations",
            ["Task ID", "Task Name", "Status", "New<br>Rem Dur", "Old<br>Rem Dur", "Var"]
        ),
        physicalPercent: new Change(
            "Updated Physical Percent Complete",
            ["Task ID", "Task Name", "Status", "New<br>% Comp", "Old<br>% Comp", "Var"]
        ),
        actualCost: new Change(
            "Updated Actual Cost",
            ["Task ID", "Task Name", "Budgeted Cost", "New<br>Actual Cost", "Old<br>Actual Cost", "Var"]
        )
    }

    proj1.tasksByCode.forEach((task, key) => {
        if (proj2.tasksByCode.has(key)) {
            const prev = proj2.tasksByCode.get(key);
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
                updates.remainingDuration.add([
                    task.task_code,
                    task.task_name,
                    task.status,
                    (task.remain_drtn_hr_cnt / 8),
                    (prev.remain_drtn_hr_cnt / 8),
                    (task.remain_drtn_hr_cnt / 8 - prev.remain_drtn_hr_cnt / 8).toFixed(2),
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
            if (actualCost(task) != actualCost(prev)){
                updates.actualCost.add([
                    task.task_code,
                    task.task_name,
                    formatCost(budgetedCost(task)),
                    formatCost(actualCost(task)),
                    formatCost(actualCost(prev)),
                    formatCost((actualCost(task) - actualCost(prev)))
                ])
            }
        }
    })
    return updates
}

const findResourceChanges = (proj1, proj2) => {
    const changes = {
        addedResources: new Change(
            "Added Resources",
            ["Task ID", "Task Name", "Resource", "Budgeted QTY", "Budgeted Cost"]
        ),
        deletedResources: new Change(
            "Deleted Resources",
            ["Task ID", "Task Name", "Resource", "Budgeted QTY", "Budgeted Cost"]
        ),
        revisedCost: new Change(
            "Revised Budgeted Cost",
            ["Task ID", "Task Name", "Resource", "New<br>Budgeted Cost", "Old<br>Budgeted Cost", "Var"]
        ),
        revisedQty: new Change(
            "Revised Budgeted Quantity",
            ["Task ID", "Task Name", "Resource", "New<br>Budgeted Qty", "Old<br>Budgeted Qty", "Var"]
        )
    }

    currRsrcs = new Map(proj1.resources.map(r => [`${r.task.task_code}|${r.rsrc_name}`, r])) 
    prevRsrcs = new Map(proj2.resources.map(r => [`${r.task.task_code}|${r.rsrc_name}`, r])) 

    currRsrcs.forEach((rsrc, key) => {
        if (!prevRsrcs.has(key)) {
            changes.addedResources.add([
                rsrc.task.task_code,
                rsrc.task.task_name,
                rsrc.rsrc_name,
                rsrc.target_qty.toFixed(2),
                formatCost(rsrc.target_cost)
            ])
        }
        else {
            prev = prevRsrcs.get(key)
            if (rsrc.target_cost != prev.target_cost){
                changes.revisedCost.add([
                    rsrc.task.task_code,
                    rsrc.task.task_name,
                    rsrc.rsrc_name,
                    formatCost(rsrc.target_cost),
                    formatCost(prev.target_cost),
                    formatCost((rsrc.target_cost - prev.target_cost))
                ])
            }
        }
    })

    prevRsrcs.forEach((rsrc, key) => {
        if (!currRsrcs.has(key)) {
            changes.deletedResources.add([
                rsrc.task.task_code,
                rsrc.task.task_name,
                rsrc.rsrc_name,
                rsrc.target_qty.toFixed(2),
                formatCost(rsrc.target_cost)
            ])
        }
    })

    return changes
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

    // Find task changes
    proj1.tasksByCode.forEach((task, key) => {
        // Find added tasks
        if (!proj2.tasksByCode.has(key)) {
            changes.addedTasks.add([
                task.task_code,
                task.task_name
            ])
        }
        else {
            const prev = proj2.tasksByCode.get(key)

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

    proj2.tasksByCode.forEach((task, key) => {
        if (!proj1.tasksByCode.has(key)) {
            changes.deletedTasks.add([
                task.task_code,
                task.task_name
            ])
        }
    })

    return changes
}