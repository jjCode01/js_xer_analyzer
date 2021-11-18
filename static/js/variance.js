const parseCriticalPath = (proj1, proj2) => {
    let cp = [...proj1.tasks.values()].filter(task => task.longestPath).sort((a, b) => a.finish - b.finish)
    const criticalPath = new Map(cp.map(task => [task.task_code, task]))
    if (!criticalPath) {return}
    const labels = [
        ["Task ID", ""], ["Task Name", ""], ["Status", ""], ["Other<br>Start", ""], ["Start", ""],
        ["Start<br>Var", "center"], ["Other<br>Finish", ""], ["Finish", ""], ["Finish Var", "center"]
    ]
    const table = createNewTable(labels)
    criticalPath.forEach((task, key) => {
        let vals
        if (!proj2.tasksByCode.has(key)) {
            vals = [[task.task_code, ""], [task.task_name, ""], [task.status, ""], ["", ""], [formatDate(task.start), ""], ["", ""], ["", ""], [formatDate(task.finish), ""]]
            addTableRow(table, vals)
        }
        else if (!proj2.tasksByCode.get(key).completed) {
            const prev = proj2.tasksByCode.get(key)
            const startVar = dateVarianceDays(task.start, prev.start)
            const finishVar = dateVarianceDays(task.finish, prev.finish)
            vals = [[task.task_code, ""], [task.task_name, ""], [task.status, ""], [formatDate(prev.start), ""], [formatDate(task.start), ""], [startVar, ""], [formatDate(prev.finish), ""], [formatDate(task.finish), ""], [finishVar, ""]]
            addTableRow(table, vals)
        }
        
    })
    return table
}