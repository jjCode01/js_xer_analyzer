const task_status = {
    TK_NotStart: 'Not Started',
    TK_Active: 'In Progress',
    TK_Complete: 'Completed'
}

const setDataType = (col, val) => {
    if (!val){return}
    if (col.endsWith('_date') || col.endsWith('_date2')){return new Date(val.split(" ").join("T"))}
    if (col.endsWith('_num')){return parseInt(val)}
    if (col.endsWith('_cost') || col.endsWith('_qty') || col.endsWith('_cnt')){return parseFloat(val)}
    return val
}

newTask = task => {
    task.notStarted = (task.status_code == "TK_NotStart")
    task.inProgress = (task.status_code == "TK_Active")
    task.completed = (task.status_code == "TK_Complete")
    task.longestPath = (task.driving_path_flag == "Y")
    task.status = task_status[task.status_code]
    task.resources = []
    task.predecessors = []
    task.start = task.notStarted ? task.early_start_date : task.act_start_date;
    task.finish = task.completed ? task.act_end_date : task.early_end_date;
    return task;
}

const parseFile = (file, name) => {
    let tables = {}
    let currTable = ''
    let columns = []
    let lines = file.split("\n");
    for(let line = 0; line < lines.length; line++){
        let cols = lines[line].trim().split('\t')
        switch (cols.shift()){
            case "%T":
                currTable = cols[0]
                tables[currTable] = {}
                break;
            case "%F": columns = cols; break;
            case "%R":
                let row = {}
                columns.forEach((k, i) => row[k] = setDataType(k, cols[i]));

                switch (currTable) {
                    case "CALENDAR":
                        tables.CALENDAR[row.clndr_id] = row;
                        break;
                    case "PROJECT":
                        tables.PROJECT[row.proj_id] = row;
                        tables.PROJECT[row.proj_id].tasks = new Map()
                        tables.PROJECT[row.proj_id].tasksByCode = new Map()
                        tables.PROJECT[row.proj_id].rels = []
                        tables.PROJECT[row.proj_id].resources = []
                        break;
                    case "PROJWBS":
                        if (row.proj_node_flag == "Y"){
                            tables.PROJECT[row.proj_id].proj_long_name = row.wbs_name
                        }
                        break;
                    case "RSRC":
                        tables.RSRC[row.rsrc_id] = row;
                        break;
                    case "TASK":
                        task = newTask(row)
                        task.calendar = tables.CALENDAR[task.clndr_id]
                        tables.PROJECT[task.proj_id].tasks.set(task.task_id, task)
                        tables.PROJECT[task.proj_id].tasksByCode.set(task.task_code, task)   
                        break;
                    case "TASKPRED":
                        tables.PROJECT[row['proj_id']].rels.push(row)
                        tables.PROJECT[row.proj_id].tasks.get(row.task_id).predecessors.push(row)
                        break;
                    case "TASKRSRC":
                        if (!tables.hasOwnProperty("RSRC")) {
                            alert(`File ${name} is Cost/Resourse Loaded, but it missing the required resource table [RSRC].`)
                        }
                        row.rsrc_name = tables.RSRC[row.rsrc_id].rsrc_short_name
                        row.task = tables.PROJECT[row.proj_id].tasks.get(row.task_id)
                        tables.PROJECT[row.proj_id].resources.push(row)
                        tables.PROJECT[row.proj_id].tasks.get(row.task_id).resources.push(row)
                        break;
                }
            break;
        }
    }

    return tables
}