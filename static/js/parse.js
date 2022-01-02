const STATUSTYPES = {
    TK_NotStart: 'Not Started',
    TK_Active: 'In Progress',
    TK_Complete: 'Completed'
}

const PERCENTTYPES = {
    CP_Phys: 'Physical',
    CP_Drtn: 'Duration',
    CP_Units: 'Unit'
}

const TASKTYPES = {
    TT_Mile: 'Start Milestone',
    TT_FinMile: 'Finish Milestone',
    TT_LOE: 'Level of Effort',
    TT_Task: 'Task Dependent',
    TT_Rsrc: 'Resource Dependent',
    TT_WBS: 'WBS Summary'
}

const CONSTRAINTTYPES = {
    CS_ALAP: 'As Late as Possible',
    CS_MEO: 'Finish On',
    CS_MEOA: 'Finish on or After',
    CS_MEOB: 'Finish on or Before',
    CS_MANDFIN: 'Mandatory Finish',
    CS_MANDSTART: 'Mandatory Start',
    CS_MSO: 'Start On',
    CS_MSOA: 'Start On or After',
    CS_MSOB: 'Start On or Before',
}

const setDataType = (col, val) => {
    if (!val) {
        return;
    }
    if (col.endsWith('_date') || col.endsWith('_date2')) {
        return new Date(val.split(' ').join('T'));
    }
    if (col.endsWith('_num')) {
        return parseInt(val);
    }
    if (col.endsWith('_cost') || col.endsWith('_qty') || col.endsWith('_cnt')) {
        return parseFloat(val);
    }
    return val;
}

const newProj = proj => {
    proj.tasks = new Map();
    proj.tasksByCode = new Map();
    proj.rels = [];
    proj.relsById = new Map();
    proj.resources = [];
    proj.resById = new Map();
    proj.start = proj.last_recalc_date;
    proj.wbs = new Map()
    return proj;
}

const calcPercent = task => {
    const pt = {
        CP_Phys: task.phys_complete_pct / 100,
        CP_Drtn: (task.remDur >= task.origDur) ? 0 : 1 - task.remDur / task.origDur,
        CP_Units: 1 - (task.act_work_qty + task.act_equip_qty) / (task.target_work_qty = task.target_equip_qty)
    }
    return pt[task.complete_pct_type];
}

const newTask = task => {
    task.notStarted = task.status_code == 'TK_NotStart';
    task.inProgress = task.status_code == 'TK_Active';
    task.completed = task.status_code == 'TK_Complete';
    task.longestPath = task.driving_path_flag == 'Y';
    task.isMilestone = task.task_type.endsWith('Mile');
    task.isLOE = task.task_type === 'TT_LOE';
    task.totalFloat = task.completed ? NaN : task.total_float_hr_cnt / 8
    task.freeFloat = task.completed ? NaN : task.free_float_hr_cnt / 8
    task.status = STATUSTYPES[task.status_code];
    task.resources = [];
    task.predecessors = [];
    task.successors = [];
    task.wbsMap = [];
    task.start = task.notStarted ? task.early_start_date : task.act_start_date;
    task.finish = task.completed ? task.act_end_date : task.early_end_date;
    task.origDur = task.target_drtn_hr_cnt / 8;
    task.remDur = task.remain_drtn_hr_cnt / 8;
    task.percentType = PERCENTTYPES[task.complete_pct_type];
    task.taskType = TASKTYPES[task.task_type];
    task.primeConstraint = CONSTRAINTTYPES[task.cstr_type];
    task.secondConstraint = CONSTRAINTTYPES[task.cstr_type2];
    task.percent = task.notStarted ? 0.0 : calcPercent(task);
    return task;
}

const newRelationship = rel => {
    rel.lag = rel.lag_hr_cnt / 8;
    rel.link = rel.pred_type.substring(rel.pred_type.length - 2);
    return rel;
}

const parseFile = (file, name) => {
    let tables = {};
    let currTable = '';
    let columns = [];

    const getTask = (projId, taskId) => tables.PROJECT[projId]?.tasks?.get(taskId)

    let lines = file.split('\n');
    lines.forEach(line => {
        let cols = line.trim().split('\t');
        switch (cols.shift()) {
            case 'ERMHDR':
                tables.version = cols[0];
                tables.dateCreated = cols[1];
                tables.createdBy = cols[4];
                break;
            case '%T':
                currTable = cols[0];
                tables[currTable] = {};
                break;
            case '%F':
                columns = cols;
                break;
            case '%R':
                let row = {};
                columns.forEach((k, i) => row[k] = setDataType(k, cols[i]));
                switch (currTable) {
                    case 'CALENDAR':
                        tables.CALENDAR[row.clndr_id] = row;
                        break;
                    case 'ACCOUNT':
                        tables.ACCOUNT[row.acct_id] = row;
                        break;
                    case 'PROJECT':
                        tables.PROJECT[row.proj_id] = newProj(row);
                        break;
                    case 'PROJWBS':
                        tables.PROJECT[row.proj_id].wbs.set(row.wbs_id, row);
                        if (row.proj_node_flag == 'Y') {
                            tables.PROJECT[row.proj_id].name = row.wbs_name;
                        }
                        break;
                    case 'RSRC':
                        tables.RSRC[row.rsrc_id] = row;
                        break;
                    case 'TASK':
                        task = newTask(row);
                        task.project = tables.PROJECT[task.proj_id]
                        task.calendar = tables.CALENDAR[task.clndr_id];
                        task.wbs = task.project.wbs.get(task.wbs_id);
                        task.wbsStruct = [task.wbs];
                        let wbs = task.wbs
                        while (true) {
                            if (!task.project.wbs.has(wbs.parent_wbs_id)){
                                break;
                            }
                            wbs = task.project.wbs.get(wbs.parent_wbs_id);
                            task.wbsStruct.unshift(wbs)
                        }
                        tables.PROJECT[task.proj_id].tasks.set(task.task_id, task);
                        tables.PROJECT[task.proj_id].tasksByCode.set(task.task_code, task); 
                        if (task.start < tables.PROJECT[task.proj_id].start) {
                            tables.PROJECT[task.proj_id].start = task.start;
                        }
                        break;
                    case 'TASKPRED':
                        rel = newRelationship(row);
                        rel.predTask = getTask(rel.pred_proj_id, rel.pred_task_id);
                        rel.succTask = getTask(rel.proj_id, rel.task_id);
                        rel.logicId = `${rel.predTask.task_code}|${rel.succTask.task_code}|${rel.link}`;
                        tables.PROJECT[rel.proj_id].rels.push(rel);
                        tables.PROJECT[rel.proj_id].relsById.set(rel.logicId, rel);
                        tables.PROJECT[rel.proj_id].tasks.get(rel.task_id).predecessors.push(rel);
                        tables.PROJECT[rel.pred_proj_id].tasks.get(rel.pred_task_id).successors.push(rel);
                        break;
                    case 'TASKRSRC':
                        row.task = tables.PROJECT[row.proj_id].tasks.get(row.task_id);
                        row.actualCost = row.act_reg_cost + row.act_ot_cost;
                        row.atCompletionCost = row.actualCost + row.remain_cost;
                        row.earnedValue = row.task.percent * row.target_cost
                        if (row.acct_id && tables.hasOwnProperty('ACCOUNT')) {
                            row.account = tables.ACCOUNT[row.acct_id];
                        }
                        tables.PROJECT[row.proj_id].resources.push(row);
                        tables.PROJECT[row.proj_id].tasks.get(row.task_id).resources.push(row);
                        if (tables.hasOwnProperty('RSRC')) {
                            row.rsrcName = tables.RSRC[row.rsrc_id].rsrc_short_name;
                            row.resId = `${row.task.task_code}|${row.rsrcName}|${row?.account?.acct_short_name}`; // need to add account #
                            tables.PROJECT[row.proj_id].resById.set(row.resId, row);
                        } //else {
                        //     alert(`File ${name} is Cost/Resourse Loaded, but it missing the required resource table [RSRC].`)
                        // }
                        // *******************  NEED TO ADD ACCOUNT TABLE ******************
                        break;
                }
            break;
        }
    })

    Object.values(tables.PROJECT).forEach(proj => {
        proj.wbs.forEach(wbs => {
            let id = [wbs.wbs_short_name];
            let node = wbs;
            while (true) {
                if (!proj.wbs.has(node.parent_wbs_id) || proj.wbs.get(node.parent_wbs_id).proj_node_flag === 'Y'){
                    break;
                }
                node = proj.wbs.get(node.parent_wbs_id);
                id.unshift(node.wbs_short_name)
            }
            wbs.wbsID = id.join('.')
            // console.log(wbs.wbsID + ': ', wbs.wbs_name)
        })
    })

    return tables;
}