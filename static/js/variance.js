const sortByDate = (a, b) => {
    if (a.finish.getDate() === b.finish.getDate()) {return a.start < b.start ? -1 : 1}
    return a.finish < b.finish ? -1 : 1
}

const parseCriticalPath = (proj1, proj2) => {
    let currentCP = new Map([...proj1.tasks.values()].filter(task => task.longestPath).map(task => [task.task_code, task]))
    let previousCP = new Map([...proj2.tasks.values()].filter(task => task.longestPath).map(task => {
        if (proj1.tasksByCode.has(task.task_code)){
            return [task.task_code, proj1.tasksByCode.get(task.task_code)]
        }
        return [task.task_code, task]
    }))

    let criticalPath = [...currentCP.values()].concat([...previousCP.values()].filter(task => !currentCP.has(task.task_code)))
    criticalPath = criticalPath.sort((a, b) => sortByDate(a, b))

    if (!criticalPath) {return}

    const labels = [
        ["Task ID", ""], ["Task Name", ""], ["Status", ""],
        ["Previous<br>Start", "txt-center"], ["Current<br>Start", "txt-center"], ["Start<br>Var", "txt-center"],
        ["Previous<br>Finish", "txt-center"], ["Current<br>Finish", "txt-center"], ["Finish<br>Var", "txt-center"],
        ["Current<br>CP", "txt-center"], ["Previous<br>CP", "txt-center"]
    ]

    const table = createNewTable(labels)
    let vals
    criticalPath.forEach(task => {
        if (!proj2.tasksByCode.has(task.task_code)) {
            // Task added in current schedule
            vals = [
                [task.task_code, ""], [task.task_name, ""], [task.status, ""],
                ["", ""], [formatDate(task.start), ""], ["", ""], 
                ["", ""], [formatDate(task.finish), ""], ["", ""],
                ['&#10003;', "txt-center"], ["", "txt-center"]
            ]
            addTableRow(table, vals)
        } else if (!proj1.tasksByCode.has(task.task_code)) {
            // Task deleted in current schedule
            vals = [
                [task.task_code, ""], [task.task_name, ""], ["Deleted", ""],
                [formatDate(task.start), ""], ["", ""], ["", ""],
                [formatDate(task.finish), ""], ["", ""], ["", ""],
                ["", "txt-center"], ['&#10003;', "txt-center"]
            ]
            addTableRow(table, vals)
        } else if (!proj2.tasksByCode.get(task.task_code).completed) {
            const prev = proj2.tasksByCode.get(task.task_code)
            const curr = proj1.tasksByCode.get(task.task_code)

            const startVar = dateVarianceDays(prev.start, curr.start)
            const finishVar = dateVarianceDays(prev.finish, curr.finish)

            const isCurrCP = currentCP.has(task.task_code) ? '&#10003;' : ""
            const isPrevCP = previousCP.has(task.task_code) ? '&#10003;' : ""

            vals = [
                [task.task_code, ""], [task.task_name, ""], [task.status, ""],
                [formatDate(prev.start), ""], [formatDate(curr.start), ""], [startVar, "txt-center"],
                [formatDate(prev.finish), ""], [formatDate(curr.finish), ""], [finishVar, "txt-center"],
                [isCurrCP, "txt-center"], [isPrevCP, "txt-center"]
            ]
            addTableRow(table, vals)
        }
    })
    return table
}