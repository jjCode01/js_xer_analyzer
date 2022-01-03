let tables = {
    current: {},
    previous: {}
}

let projects = {}

let FLOAT = {
    critical: 0,
    nearCritical: 20,
    high: 50,
}

const hasTask = (task, proj) => proj.tasksByCode.has(task.task_code)
const getTask = (task, proj) => proj.tasksByCode.get(task.task_code)

const getPrevLogic = rel => projects.previous.relsById.get(rel.logicId)
const prevHasLogic = rel => projects.previous.relsById.has(rel.logicId)

const getPrevRes = (res, proj) => {
    if (tables.previous.hasOwnProperty('RSRC') && res.hasOwnProperty('resId')) {
        return projects.previous.resById.get(res.resId)
    }
    if (hasTask(res.task, projects.previous)) {
        if (res.task.resources.length === 1 && getTask(res.task, projects.previous).resources.length === 1) {
            return getTask(res.task, projects.previous).resources[0];
        }
        for (let i = 0; i < getTask(res.task, projects.previous).resources.length; i++) {
            pr = getTask(res.task, projects.previous).resources[i]
            if (pr.target_cost === res.target_cost && pr.target_qty === res.target_qty) {
                return pr;
            }
        }
    }
    return undefined
}

const prevHasRes = res => {
    if (tables.previous.hasOwnProperty('RSRC') && res.hasOwnProperty('resId')) {
        return projects.previous.resById.has(res.resId)
    }
    if (hasTask(res.task, projects.previous)) {
        if (res.task.resources.length === 1 && getTask(res.task, projects.previous).resources.length === 1) {
            return true;
        }
        for (let i = 0; i < getTask(res.task, projects.previous).resources.length; i++) {
            pr = getTask(res.task, projects.previous).resources[i]
            if (pr.target_cost === res.target_cost && pr.target_qty === res.target_qty) {
                return true;
            }
        }
    }
    return false
}

const currHasRes = res => {
    if (tables.current.hasOwnProperty('RSRC') && res.hasOwnProperty('resId')) {
        return projects.current.resById.has(res.resId)
    }
    if (hasTask(res.task, projects.current)) {
        if (res.task.resources.length === 1 && getTask(res.task, projects.current).resources.length === 1) {
            return true;
        }
        for (let i = 0; i < getTask(res.task, projects.current).resources.length; i++) {
            cr = getTask(res.task, projects.current).resources[i]
            if (cr.target_cost === res.target_cost && cr.target_qty === res.target_qty) {
                return true;
            }
        }
    }
    return false
}

function removeElements(id){
    const sec = document.getElementById(id);
    while (sec.firstChild) {
        sec.removeChild(sec.firstChild);
    }
}

function updateSection(id, el){
    removeElements(id);
    document.getElementById(id).append(el);
}

let updates = {
    started: {
        title: "Activities Started",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Start', 'Finish'],
        tasks: undefined,
        id: "ud-started",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, 
                formatDate(task.start), formatDate(task.finish)
            ])
        }
    },
    finished: {
        title: "Activities Finished",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Start', 'Finish'],
        tasks: [],
        id: "ud-finished",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), 
                formatDate(task.finish)
            ])
        }
    },
    startFinish: {
        title: "Activities Started and Finished",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Start', 'Finish'],
        tasks: [],
        id: "ud-startFinish",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), 
                formatDate(task.finish)
            ])
        }
    },
    percent: {
        title: "Updated Percent Completes",
        align: ['left', 'left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Percent\r\nType', '% Comp', 'Prev\r\n% Comp', 'Var'],
        tasks: [],
        id: "ud-percent",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.percentType, 
                formatPercent(task.percent), formatPercent(getTask(task, projects.previous).percent), 
                formatPercent(task.percent - getTask(task, projects.previous).percent)
            ])
        }
    },
    duration: {
        title: "Updated Remaining Durations",
        align: ['left', 'left', 'left', 'center', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 'Rem\r\nDur', 'Prev\r\nRem\r\nDur', 'Var'],
        tasks: [],
        id: "ud-duration",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatNumber(task.origDur), 
                formatNumber(task.remDur), formatNumber(getTask(task, projects.previous).remDur), 
                formatNumber(task.remDur - getTask(task, projects.previous).remDur)
            ])
        }
    },
    cost: {
        title: "Updated Actual Cost",
        align: ['left', 'left', 'left', 'right', 'right', 'right', 'right'],
        columns: ['Act ID', 'Act Name', 'Status', 'Budgeted\r\nCost', 'Actual\r\nCost', 'Prev\r\nActual\r\nCost', 'Var'],
        tasks: [],
        id: "ud-cost",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatCost(budgetedCost(task)), 
                formatCost(actualCost(task)), formatCost(actualCost(getTask(task, projects.previous))), 
                formatCost(actualCost(task) - actualCost(getTask(task, projects.previous)))
            ])
        }
    },
    regress: {
        title: "Regressive Updates",
        align: ['left', 'left', 'left', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Prev\r\nStatus', 'Orig\r\nDur', 'Rem\r\nDur', 'Prev\r\nRem\r\nDur', 'RD\r\nVar', '%\r\nComp', 'Prev\r\n%\r\nComp', '%\r\nVar'],
        tasks: [],
        id: "ud-regress",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, getTask(task, projects.previous).status, task.origDur, 
                task.remDur, getTask(task, projects.previous).remDur, formatNumber(task.remDur - getTask(task, projects.previous).remDur),
                formatPercent(task.percent), formatPercent(getTask(task, projects.previous).percent), 
                formatPercent(task.percent - getTask(task, projects.previous).percent)
            ])
        }
    }
}

const checkLongestPath = task => task.longestPath ? '\u2611' : '\u2610';

let taskChanges = {
    added: {
        title: "Added Activities",
        align: ['left', 'left', 'left', 'center', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 'Start', 'Finish', 'Longest\r\nPath'],
        tasks: [],
        id: "tk-added",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.origDur, 
                formatDate(task.start), formatDate(task.finish), checkLongestPath(task)
            ])
        }
    },
    deleted: {
        title: "Deleted Activities",
        align: ['left', 'left', 'left', 'center', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 'Start', 'Finish', 'Longest\r\nPath'],
        tasks: [],
        id: "tk-deleted",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.origDur, 
                formatDate(task.start), formatDate(task.finish), checkLongestPath(task)
            ])
        }
    },
    name: {
        title: "Revised Activity Names",
        align: ['left', 'left', 'left'],
        columns: ['Act ID', 'Act Name', 'Prev Name'],
        tasks: [],
        id: "tk-name",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, getTask(task, projects.previous).task_name
            ])
        }
    },
    duration: {
        title: "Revised Original Durations",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 'Prev\r\nOrig\r\nDur', 'Var'],
        tasks: [],
        id: "tk-duration",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatNumber(task.origDur), 
                formatNumber(getTask(task, projects.previous).origDur), 
                formatNumber(task.origDur - getTask(task, projects.previous).origDur)
            ])
        }
    },
    calendar: {
        title: "Revised Activity Calendars",
        align: ['left', 'left', 'left', 'left', 'left'],
        columns: ['Act ID', 'Act Name', 'Status', 'Calendar', 'Prev\r\nCalendar'],
        tasks: [],
        id: "tk-calendar",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.calendar.clndr_name, 
                getTask(task, projects.previous).calendar.clndr_name 
            ])
        }
    },
    start: {
        title: "Revised Actual Starts",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Actual\r\nStart', 'Prev\r\nActual\r\nStart', 'Var'],
        tasks: [],
        id: "tk-start",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), 
                formatDate(getTask(task, projects.previous).start), 
                formatVariance(dateVariance(task.start, getTask(task, projects.previous).start))
            ])
        }
    },
    finish: {
        title: "Revised Actual Finishes",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Actual\r\nFinish', 'Prev\r\nActual\r\nFinish', 'Var'],
        tasks: [],
        id: "tk-finish",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.finish), 
                formatDate(getTask(task, projects.previous).finish), 
                formatVariance(dateVariance(task.finish, getTask(task, projects.previous).finish))
            ])
        }
    },
    wbs: {
        title: "Revised WBS Assignment",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'WBS', 'Prev\r\nWBS'],
        tasks: [],
        id: "tk-wbs",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.wbs.wbsID, 
                getTask(task, projects.previous).wbs.wbsID
            ])
        }
    },
}

let logicChanges = {
    added: {
        title: "Added Relationships",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: ['Pred ID', 'Predecessor Name', 'Succ ID', 'Successor Name', 'Link', 'Lag'],
        tasks: [],
        id: "rl-added",
        getRows: function() {
            return this.tasks.map(task => [
                task.predTask.task_code, task.predTask.task_name, task.succTask.task_code, task.succTask.task_name, task.link, task.lag 
            ])
        }
    },
    deleted: {
        title: "Deleted Relationships",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: ['Pred ID', 'Predecessor Name', 'Succ ID', 'Successor Name', 'Link', 'Lag'],
        tasks: [],
        id: "rl-deleted",
        getRows: function() {
            return this.tasks.map(task => [
                task.predTask.task_code, task.predTask.task_name, task.succTask.task_code, task.succTask.task_name, task.link, task.lag 
            ])
        }
    },
    revised: {
        title: "Revised Relationships",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: ['Pred ID', 'Predecessor Name', 'Succ ID', 'Successor Name', 'Link:Lag', 'Prev\r\nLink:Lag'],
        tasks: [],
        id: "rl-revised",
        getRows: function() {
            return this.tasks.map(task => [
                task.predTask.task_code, task.predTask.task_name, task.succTask.task_code, task.succTask.task_name, `${task.link}:${task.lag}`, `${getPrevLogic(task).link}:${getPrevLogic(task).lag}` 
            ])
        }
    },
}

let resourceChanges = {
    added: {
        title: "Added Resources",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nQty', 'Budgeted\r\nCost'],
        tasks: [],
        id: "rs-added",
        getRows: function() {
            return this.tasks.map(task => [
                task.task.task_code, task.task.task_name, task.task.status, task.rsrcName, formatNumber(task.target_qty), formatCost(task.target_cost)
            ])
        }
    },
    deleted: {
        title: "Deleted Resources",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nQty', 'Budgeted\r\nCost'],
        tasks: [],
        id: "rs-deleted",
        getRows: function() {
            return this.tasks.map(task => [
                task.task.task_code, task.task.task_name, task.task.status, task.rsrcName, formatNumber(task.target_qty), formatCost(task.target_cost)
            ])
        }
    },
    revisedCost: {
        title: "Revised Resource Cost",
        align: ['left', 'left', 'left', 'left', 'right', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nCost', 'Prev\r\nBudgeted\r\nCost', 'Var'],
        tasks: [],
        id: "rs-cost",
        getRows: function() {
            return this.tasks.map(res => {
                const prevCost = getPrevRes(res).target_cost;
                return [
                    res.task.task_code, res.task.task_name, res.task.status, 
                    res.rsrcName, formatCost(res.target_cost), formatCost(prevCost), 
                    formatCost(res.target_cost - prevCost)
                ]
            })
        }
    },
    revisedUnits: {
        title: "Revised Resource Quantity",
        align: ['left', 'left', 'left', 'left', 'right', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nQty', 'Prev\r\nBudgeted\r\nQty', 'Var'],
        tasks: [],
        id: "rs-units",
        getRows: function() {
            return this.tasks.map(res => {
                const prevQty = getPrevRes(res).target_qty;
                return [res.task.task_code, res.task.task_name, res.task.status, res.rsrcName, formatNumber(res.target_qty), formatNumber(prevQty), formatNumber(res.target_qty - prevQty)]
            })
        }
    },
}

let constraintChanges = {
    addedPrim: {
        title: "Added Primary Constraints",
        align: ['left', 'left', 'left', 'left', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Primary\r\nConstraint\r\n', 'Constraint\r\nDate'],
        tasks: [],
        id: "cs-added-prim",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.primeConstraint, formatDate(task.cstr_date)
            ])
        }
    },
    deletedPrim: {
        title: "Deleted Primary Constraints",
        align: ['left', 'left', 'left', 'left', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Primary\r\nConstraint', 'Constraint\r\nDate'],
        tasks: [],
        id: "cs-deleted-prim",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.primeConstraint, formatDate(task.cstr_date)
            ])
        }
    },
    revisedPrim: {
        title: "Revised Primary Constraint Dates",
        align: ['left', 'left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Constraint\r\nType', 'Constraint\r\nDate', 'Prev\r\nConstraint\r\nDate', 'Var\r\n(Days)'],
        tasks: [],
        id: "cs-revised-prim",
        getRows: function() {
            return this.tasks.map(task => {
                const prevDate = getTask(task, projects.previous).cstr_date
                const variance = (task.cstr_date && prevDate) ? (task.cstr_date.getTime() - prevDate.getTime()) / (1000 * 3600 * 24) : "N/A"
                return [
                    task.task_code, task.task_name, task.status, task.primeConstraint, 
                    formatDate(task.cstr_date), formatDate(getTask(task, projects.previous).cstr_date), 
                    formatNumber(variance)
                ]
            })
        }
    },
}

let openEnds = {
    predecessor: {
        title: "Activities With No Predecessor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        tasks: [],
        id: "open-pred",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    },
    successor: {
        title: "Activities With No Successor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        tasks: [],
        id: "open-succ",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    },
    start: {
        title: "Activities With No Start (SS or FS) Predecessor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        tasks: [],
        id: "open-start",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    },
    finish: {
        title: "Activities With No Finish (FS or FF) Successor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        tasks: [],
        id: "open-finish",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    }
}

let dateWarnings = {
    start: {
        title: "Activities With Actual Start on or After Data Date",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Actual\r\nStart', 'Data\r\nData'],
        tasks: [],
        id: "inv-start",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), formatDate(projects.current.last_recalc_date)
            ])
        }
    },
    finish: {
        title: "Activities With Actual Finish on or After Data Date",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Actual\r\nFinish', 'Data\r\nData'],
        tasks: [],
        id: "inv-finish",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.finish), formatDate(projects.current.last_recalc_date)
            ])
        }
    },
    expected: {
        title: "Activities With an Expected Finish Date",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Expected\r\nFinish', 'Orig\r\nDur', 'Rem\r\nDur'],
        tasks: [],
        id: "inv-expected",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.expect_end_date), formatNumber(task.origDur), formatNumber(task.remDur)
            ])
        }
    },
    suspend: {
        title: "Activities With Suspend / Resume Dates",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Suspend', 'Resume'],
        tasks: [],
        id: "inv-suspend",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.suspend_date), formatDate(task.resume_date)
            ])
        }
    }
}

let durWarnings = {
    long: {
        title: "Construction Activities With Original Durations Greater than 20 Days",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur'],
        tasks: [],
        id: "dur-long",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, task.calendar.clndr_name, task.origDur
            ])
        }
    },
    short: {
        title: "Activities With Original Durations Equal to 1 Day",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur'],
        tasks: [],
        id: "dur-short",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, task.calendar.clndr_name, task.origDur
            ])
        }
    },
    zero: {
        title: "Activities With Original Durations Equal to 0 Days",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur'],
        tasks: [],
        id: "dur-zero",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, task.calendar.clndr_name, task.origDur
            ])
        }
    },
    rdzero: {
        title: "Incomplete Activities with Zero Remaining Duration",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur', 'Rem\r\nDur'],
        tasks: [],
        id: "dur-rdzero",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, task.calendar.clndr_name, task.origDur, task.remDur
            ])
        }
    },
    odrd: {
        title: "Open Activities With Unequal Original and Remaining Durations",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur', 'Rem\r\nDur'],
        tasks: [],
        id: "dur-odrd",
        getRows: function() {
            return this.tasks.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, task.calendar.clndr_name, task.origDur, task.remDur
            ])
        }
    }
}

let costWarnings = {
    budget: {
        title: "Budgeted Cost Differs from At Completion Cost",
        align: ['left', 'left', 'left', 'left', 'right', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nCost', 'At Completion\r\nCost', 'Variance'],
        tasks: [],
        id: "cost-budget",
        getRows: function() {
            return this.tasks.map(res => {
                return [
                    res.task.task_code, res.task.task_name, res.task.status, 
                    res.rsrcName, formatCost(res.target_cost), formatCost(res.atCompletionCost), 
                    formatCost(res.atCompletionCost - res.target_cost)
                ]
            })
        }
    },
    earned: {
        title: "Actual Cost to Date Differs from Earned Value",
        align: ['left', 'left', 'left', 'left', 'center', 'right', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Resource', '%\r\nComp', 'Actual\r\nCost', 'Earned\r\nValue', 'Variance'],
        tasks: [],
        id: "cost-ev",
        getRows: function() {
            return this.tasks.map(res => {
                return [
                    res.task.task_code, res.task.task_name, res.task.status, 
                    res.rsrcName, formatPercent(res.task.percent), formatCost(res.actualCost), formatCost(res.earnedValue), 
                    formatCost(res.actualCost - res.earnedValue)
                ]
            })
        }
    },
    regress: {
        title: "Regressive This Period Cost",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nCost', 'This Period\r\nCost'],
        tasks: [],
        id: "cost-regress",
        getRows: function() {
            return this.tasks.map(res => {
                return [
                    res.task.task_code, res.task.task_name, res.task.status, 
                    res.rsrcName, formatCost(res.target_cost), formatCost(res.act_this_per_cost)
                ]
            })
        }
    }
}

function menuClickHandle(e, id) {
    document.querySelectorAll('.cat').forEach(el => el.style.display = 'none')
    document.querySelectorAll('.active-btn').forEach(el => el.classList.remove('active-btn'))
    document.getElementById(id).style.display = 'flex';
    e.currentTarget.classList.add('active-btn');
}

const analyzeProject = proj => {
    const tasks = [...proj.tasks.values()]
    proj.notStarted = tasks.filter(task => task.notStarted)
    proj.inProgress = tasks.filter(task => task.inProgress)
    proj.completed = tasks.filter(task => task.completed)

    proj.taskDependent = tasks.filter(task => task.taskType === 'Task Dependent')
    proj.milestones = tasks.filter(task => task.isMilestone)
    proj.loes = tasks.filter(task => task.isLOE)
    proj.rsrcDependent = tasks.filter(task => task.taskType === 'Resource Dependent')

    proj.longestPath = tasks.filter(task => task.longestPath)
    proj.critical = tasks.filter(task => task.totalFloat <= FLOAT.critical)
    proj.nearCritical = tasks.filter(task => task.totalFloat > FLOAT.critical && task.totalFloat <= FLOAT.nearCritical)
    proj.normalFloat = tasks.filter(task => task.totalFloat > FLOAT.nearCritical && task.totalFloat < FLOAT.high)
    proj.highFloat = tasks.filter(task => task.totalFloat >= FLOAT.high)

    proj.fsLogic = proj.rels.filter(rel => rel.link === "FS")
    proj.ffLogic = proj.rels.filter(rel => rel.link === "FF")
    proj.ssLogic = proj.rels.filter(rel => rel.link === "SS")
    proj.sfLogic = proj.rels.filter(rel => rel.link === "SF")

    proj.scheduleDuration = (proj.scd_end_date.getTime() - proj.start.getTime()) / (1000 * 3600 * 24)
    proj.remScheduleDuration = (proj.scd_end_date.getTime() - proj.last_recalc_date.getTime()) / (1000 * 3600 * 24)

    proj.origDurSum = [...proj.tasks.values()].reduce((od, task) => od += task.origDur, 0)
    proj.remDurSum = [...proj.tasks.values()].reduce((rd, task) => rd += task.remDur, 0)

    const x = (proj.inProgress.length / 2 + proj.completed.length) / proj.tasks.size
    const y = (1 - proj.remDurSum / proj.origDurSum) / 2
    proj.physPercentComp = (x + y) / 2
    proj.schedPercentComp = 1 - proj.remScheduleDuration / proj.scheduleDuration

    proj.budget = budgetedCost(proj)
    proj.actualCost = actualCost(proj)
    proj.thisPeriodCost = thisPeriodCost(proj)
    proj.remainingCost = remainingCost(proj)
    return proj
}

function updateProjCard(name, value){
    let proj = analyzeProject(tables[name].PROJECT[value])
    console.log(proj.name)
    projects[name] = proj

    document.getElementById(`${name}-project-id`).textContent = proj.proj_short_name
    document.getElementById(`${name}-project-name`).textContent = proj.name
    document.getElementById(`${name}-project-version`).textContent = tables[name].version
    document.getElementById(`${name}-project-created`).textContent = tables[name].dateCreated
    document.getElementById(`${name}-project-user`).textContent = tables[name].createdBy
    
    document.getElementById(`${name}-start`).textContent = formatDate(proj.start)
    document.getElementById(`${name}-data-date`).textContent = formatDate(proj.last_recalc_date)
    document.getElementById(`${name}-end`).textContent = formatDate(proj.scd_end_date)

    if (proj.plan_end_date){document.getElementById(`${name}-mfb`).textContent = formatDate(proj.plan_end_date)}
    else {document.getElementById(`${name}-mfb`).textContent = "None"}

    document.getElementById(`${name}-budget`).textContent = formatCost(proj.budget)
    document.getElementById(`${name}-actual-cost`).textContent = formatCost(proj.actualCost)
    document.getElementById(`${name}-this-period`).textContent = formatCost(proj.thisPeriodCost)
    document.getElementById(`${name}-remaining-cost`).textContent = formatCost(proj.remainingCost)

    document.getElementById(`${name}-tasks`).textContent = proj.tasks.size.toLocaleString()
    document.getElementById(`${name}-not-started`).textContent = proj.notStarted.length.toLocaleString()
    document.getElementById(`${name}-in-progress`).textContent = proj.inProgress.length.toLocaleString()
    document.getElementById(`${name}-complete`).textContent = proj.completed.length.toLocaleString()

    document.getElementById(`${name}-longest-path`).textContent = proj.longestPath.length.toLocaleString()
    document.getElementById(`${name}-critical`).textContent = proj.critical.length.toLocaleString()
    document.getElementById(`${name}-near-critical`).textContent = proj.nearCritical.length.toLocaleString()
    document.getElementById(`${name}-normal-tf`).textContent = proj.normalFloat.length.toLocaleString()
    document.getElementById(`${name}-high-tf`).textContent = proj.highFloat.length.toLocaleString()

    document.getElementById(`${name}-task-dependent`).textContent = proj.taskDependent.length.toLocaleString()
    document.getElementById(`${name}-milestones`).textContent = proj.milestones.length.toLocaleString()
    document.getElementById(`${name}-loe`).textContent = proj.loes.length.toLocaleString()
    document.getElementById(`${name}-rsrc-dependent`).textContent = proj.rsrcDependent.length.toLocaleString()

    document.getElementById(`${name}-rels`).textContent = proj.rels.length.toLocaleString()
    document.getElementById(`${name}-fs`).textContent = `${proj.fsLogic.length.toLocaleString()}`
    document.getElementById(`${name}-ss`).textContent = `${proj.ssLogic.length.toLocaleString()}`
    document.getElementById(`${name}-ff`).textContent = `${proj.ffLogic.length.toLocaleString()}`
    document.getElementById(`${name}-sf`).textContent = `${proj.sfLogic.length.toLocaleString()}`

    document.getElementById(`${name}-schedule-per`).textContent = formatPercent(proj.schedPercentComp)
    document.getElementById(`${name}-physical-per`).textContent = formatPercent(proj.physPercentComp)
    if (proj.budget) {
        document.getElementById(`${name}-cost-per`).textContent = formatPercent(proj.actualCost / proj.budget)
    } else {
        document.getElementById(`${name}-cost-per`).textContent = "N/A"
    }

    function updateElements(obj, catId) {
        // let total = 0
        Object.values(obj).forEach(update => {
            document.getElementById(update.id).textContent = (update.tasks.length).toLocaleString()
            removeElements(`${update.id}-sec`)
            if (update.tasks.length) {
                const table = createTable(update.title, update.align, update.columns, update.getRows());
                updateSection(`${update.id}-sec`, table)
                activateButton(`${update.id}-btn`, `${update.id}-sec`)
                // total += update.tasks.length
            }
        })
    }

    const changeCount = obj => Object.values(obj).reduce((total, change) => total += change.tasks.length, 0)

    function createDivWithTitle(title) {
        const div = document.createElement("div");
        const titleDiv = document.createElement("div")
        div.classList.add("card", "border-rad-8px", "box-shadow")
        const h3 = document.createElement("h3")
        h3.classList.add("pad-bm-05em")
        h3.innerText = title
        div.append(h3)
        return div
    }

    function createTable(title, align, labels, vals){
        let div = createDivWithTitle(title)
        let tableDiv = document.createElement("div")
        tableDiv.classList.add("pad-10px")
        let table = document.createElement("table");
        let row = table.insertRow(), cell;
        labels.forEach((val, i) => {
            cell = document.createElement("th");
            cell.style.textAlign = align[i];
            cell.style.verticalAlign = 'bottom';
            cell.innerText = val;
            row.append(cell);
        })
        vals.forEach(task => {
            row = table.insertRow();
            task.forEach((val, i) => {
                cell = document.createElement("td");
                cell.innerText = val;
                cell.style.textAlign = align[i]
                row.append(cell);
            })
        })
        tableDiv.append(table)
        div.append(tableDiv)
        return div  
    }

    function activateButton(btn, sec){
        const b = document.getElementById(btn)
        b.classList.remove("inactive-btn")
        b.classList.add("show-data")
        b.addEventListener("click", event => menuClickHandle(event, sec))
    }

    const setRelKey = (tasks, logic) => {
        const succID = tasks.get(logic.task_id).task_code
        const predID = tasks.get(logic.pred_task_id).task_code
        return `${succID}|${predID}|${logic.pred_type}`
    }

    if (name === "current") {
        console.log("Running Current")
        const currTasks = [...projects.current.tasks.values()].sort(sortById)
        const currResources = projects.current.resources
        // const currLogic = new Map(projects.current.rels.map(r => [setRelKey(projects.current.tasks, r), r]))

        document.getElementById('title').innerText = `XER Analyzer - ${projects.current.proj_short_name}`

        document.getElementById("sched-progress").style.width = `${formatPercent(projects.current.schedPercentComp)}`
        document.getElementById("phys-progress").style.width = `${formatPercent(projects.current.physPercentComp)}`
        if (projects.current.budget) {
            document.getElementById("cost-progress").style.width = `${formatPercent(projects.current.actualCost / projects.current.budget)}`
        }

        document.getElementById("current-not-started-per").textContent = formatPercent(projects.current.notStarted.length / projects.current.tasks.size)
        document.getElementById("current-in-progress-per").textContent = formatPercent(projects.current.inProgress.length / projects.current.tasks.size)
        document.getElementById("current-complete-per").textContent = formatPercent(projects.current.completed.length / projects.current.tasks.size)
        document.getElementById("current-task-dependent-per").textContent = formatPercent(projects.current.taskDependent.length / projects.current.tasks.size)
        document.getElementById("current-milestones-per").textContent = formatPercent(projects.current.milestones.length / projects.current.tasks.size)
        document.getElementById("current-loe-per").textContent = formatPercent(projects.current.loes.length / projects.current.tasks.size)
        document.getElementById("current-rsrc-dependent-per").textContent = formatPercent(projects.current.rsrcDependent.length / projects.current.tasks.size)
        document.getElementById("current-longest-path-per").textContent = formatPercent(projects.current.longestPath.length / projects.current.tasks.size)
        document.getElementById("current-critical-per").textContent = formatPercent(projects.current.critical.length / projects.current.tasks.size)
        document.getElementById("current-near-critical-per").textContent = formatPercent(projects.current.nearCritical.length / projects.current.tasks.size)
        document.getElementById("current-normal-tf-per").textContent = formatPercent(projects.current.normalFloat.length / projects.current.tasks.size)
        document.getElementById("current-high-tf-per").textContent = formatPercent(projects.current.highFloat.length / projects.current.tasks.size)
        document.getElementById("current-fs-per").textContent = formatPercent(projects.current.fsLogic.length / projects.current.rels.length)
        document.getElementById("current-ss-per").textContent = formatPercent(projects.current.ssLogic.length / projects.current.rels.length)
        document.getElementById("current-ff-per").textContent = formatPercent(projects.current.ffLogic.length / projects.current.rels.length)
        document.getElementById("current-sf-per").textContent = formatPercent(projects.current.sfLogic.length / projects.current.rels.length)


        //************************************CHART********************************
        var ctxActivityStatus = document.getElementById('activityStatusChart');
        var myChart = new Chart(ctxActivityStatus, {
            type: 'doughnut',
            data: {
                labels: ['Not Started', 'In Progress', 'Complete'],
                datasets: [{
                    label: '# of Activities',
                    data: [
                        projects.current.notStarted.length,
                        projects.current.inProgress.length,
                        projects.current.completed.length
                    ],
                    backgroundColor: [
                        'rgba(255, 99, 132, 1)', // red
                        'rgba(113, 194, 92, 1)', // green
                        'rgba(54, 162, 235, 1)', // blue
                    ],
                    hoverOffset: 3
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false,
                    }
                }
            }
        });

        var ctxActivityType = document.getElementById('activityTypeChart');
        var myChart = new Chart(ctxActivityType, {
            type: 'doughnut',
            data: {
                labels: ['Task', 'Milestone', 'Level of Effort', 'Resource'],
                datasets: [{
                    label: '# of Activities',
                    data: [
                        projects.current.taskDependent.length,
                        projects.current.milestones.length,
                        projects.current.loes.length,
                        projects.current.rsrcDependent.length,
                    ],
                    backgroundColor: [
                        'rgba(255, 99, 132, 1)', // red
                        'rgba(113, 194, 92, 1)', // green
                        'rgba(54, 162, 235, 1)', // blue
                        'rgba(255, 206, 86, 1)', // yellow
                    ],
                    hoverOffset: 3
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false,
                    }
                }
            }
        });

        var ctxRelationship = document.getElementById('relationshipChart');
        var myChart = new Chart(ctxRelationship, {
            type: 'doughnut',
            data: {
                labels: ['Finish-Start', 'Finish-Finish', 'Start-Start', 'Start-Finish'],
                datasets: [{
                    label: '# of Relationships',
                    data: [
                        projects.current.fsLogic.length,
                        projects.current.ffLogic.length,
                        projects.current.ssLogic.length,
                        projects.current.sfLogic.length
                    ],
                    backgroundColor: [
                        'rgba(113, 194, 92, 1)', // green
                        'rgba(255, 206, 86, 1)', // yellow
                        'rgba(54, 162, 235, 1)', // blue
                        'rgba(255, 99, 132, 1)', // red
                    ],
                    hoverOffset: 3
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false,
                    }
                }
            }
        });

        var ctxFloat = document.getElementById('activityFloatChart');
        var myChart = new Chart(ctxFloat, {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'Near-Critical', 'Normal Float', 'High Float'],
                datasets: [{
                    label: 'Total Float',
                    data: [
                        projects.current.critical.length,
                        projects.current.nearCritical.length,
                        projects.current.normalFloat.length,
                        projects.current.highFloat.length
                    ],
                    backgroundColor: [
                        'rgba(255, 99, 132, 1)', // red
                        'rgba(255, 206, 86, 1)', // yellow
                        'rgba(113, 194, 92, 1)', // green
                        'rgba(54, 162, 235, 1)', // blue
                        
                    ],
                    hoverOffset: 3
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false,
                    }
                }
            }
        });

        
        //************************************CHART********************************

        openEnds.predecessor.tasks = currTasks.filter(task => !task.predecessors.length)
        openEnds.successor.tasks = currTasks.filter(task => !task.successors.length)
        openEnds.start.tasks = currTasks.filter(task => {
            const startPreds = task.predecessors.filter(pred => pred.link === "SS" || pred.link === "FS" );
            return task.predecessors.length && !startPreds.length
        })
        openEnds.finish.tasks = currTasks.filter(task => {
            const finSuccs = task.successors.filter(succ => succ.link === "FF" || succ.link === "FS" );
            return task.successors.length && !finSuccs.length
        })
        document.getElementById("open").innerText = changeCount(openEnds).toLocaleString()
        updateElements(openEnds)

        dateWarnings.start.tasks = currTasks.filter(task => !task.notStarted && task.start.getTime() >= projects.current.last_recalc_date.getTime())
        dateWarnings.finish.tasks = currTasks.filter(task => task.completed && task.finish.getTime() >= projects.current.last_recalc_date.getTime())
        dateWarnings.expected.tasks = currTasks.filter(task => !task.completed && task.expect_end_date)
        dateWarnings.suspend.tasks = currTasks.filter(task => task.suspend_date)
        document.getElementById("inv").innerText = changeCount(dateWarnings).toLocaleString()
        updateElements(dateWarnings)

        costWarnings.budget.tasks = currResources.filter(res => res.target_cost !== res.atCompletionCost)
        costWarnings.earned.tasks = currResources.filter(res => res.actualCost !== res.earnedValue)
        costWarnings.regress.tasks = currResources.filter(res => {
            return (
                (res.target_cost > 0 && res.act_this_per_cost < 0) ||
                (res.target_cost < 0 && res.act_this_per_cost > 0)
            )
        })
        document.getElementById("cost").innerText = changeCount(costWarnings).toLocaleString()
        updateElements(costWarnings)

        const startsWithConstructionVerb = task => {
            const name = task.task_name.toLowerCase()
            const verbs = ['install', 'erect', 'swing', 'set', 'pour', 'place', 'form', 'layout', 'excavate', 'dig', 'rough in', 'rough-in']
            return verbs.some(word => name.startsWith(word));
        }

        const isSubmittal = task => {
            const name = task.task_name.toLowerCase()
            const verbs = ['submit', 'shop drawing', 'product data', 'review', 'approve', 'approval', 'procure', 'fabricate', 'lead time', 'deliver', 'obtain', 'buyout', 'purchase', 'coordination', 'coordinate', 'allowance'];
            const cond1 = verbs.some(word => name.includes(word));
            const cond2 = name.includes('plan') && (name.includes('prepare') || name.includes('develop'))
            let underSubmittalWBS = false;
            const proj = task.project
            let wbs = task.wbs;
            while (true) {
                if (wbs.wbs_name.toLowerCase().includes("submittal")){
                    underSubmittalWBS = true;
                    break;
                }
                if (!proj.wbs.has(wbs.parent_wbs_id)){
                    break;
                }
                wbs = proj.wbs.get(wbs.parent_wbs_id);
            }
            return underSubmittalWBS || (!startsWithConstructionVerb(task) && (cond1 || cond2))
        }

        const oneDayOK = task => {
            const name = task.task_name.toLowerCase()
            const verbs = ['inspect', 'survey', 'test', 'submit', 'meeting', 'session', 'presentation', 'conference', 'ceremony', 'issue', 'award', 'verify', 'verification']
            return !startsWithConstructionVerb(task) && verbs.some(word => name.includes(word))
        }

        durWarnings.long.tasks = currTasks.filter(task => !task.isLOE && task.origDur > 20 && !isSubmittal(task))
        durWarnings.short.tasks = currTasks.filter(task => !task.isLOE && task.origDur === 1 && !oneDayOK(task))
        durWarnings.zero.tasks = currTasks.filter(task => !task.isMilestone && task.origDur === 0)
        durWarnings.rdzero.tasks = currTasks.filter(task => !task.isMilestone && !task.completed & !task.origDur === 0 & task.remDur === 0)
        durWarnings.odrd.tasks = currTasks.filter(task => task.notStarted && task.origDur !== task.remDur)
        document.getElementById("dur").innerText = changeCount(durWarnings).toLocaleString()
        updateElements(durWarnings)
    }

    if (name === "previous") {
        const currTasks = [...projects.current.tasks.values()].sort(sortById)
        const prevTasks = [...projects.previous.tasks.values()].sort(sortById)

        const currResources = projects.current.resources
        const prevResources = projects.previous.resources

        updates.started.tasks = currTasks.filter(task => task.inProgress && hasTask(task, projects.previous) && getTask(task, projects.previous).notStarted).sort(sortByStart)
        updates.finished.tasks = (currTasks.filter(task => task.completed && hasTask(task, projects.previous) && getTask(task, projects.previous).inProgress)).sort(sortByFinish)
        updates.startFinish.tasks = (currTasks.filter(task => task.completed && hasTask(task, projects.previous) && getTask(task, projects.previous).notStarted)).sort(sortByFinish)
        updates.percent.tasks = (currTasks.filter(task => hasTask(task, projects.previous) && task.percent > getTask(task, projects.previous).percent)).sort(sortByStart)
        updates.duration.tasks = (currTasks.filter(task => task.remDur !== task.origDur && hasTask(task, projects.previous) && task.remDur < getTask(task, projects.previous).remDur)).sort(sortByStart)
        updates.cost.tasks = currTasks.filter(task => hasTask(task, projects.previous) && actualCost(task) !== actualCost(getTask(task, projects.previous)))
        updates.regress.tasks = currTasks.filter(task => {
            return (
                hasTask(task, projects.previous) && 
                ((!task.completed && getTask(task, projects.previous).completed) ||
                (task.notStarted && !getTask(task, projects.previous).notStarted) ||
                (task.origDur !== task.remDur && task.remDur > getTask(task, projects.previous).remDur) ||
                (task.percent < getTask(task, projects.previous).percent))
            )
        })
        document.getElementById("ud").innerText = changeCount(updates).toLocaleString()
        updateElements(updates)

        taskChanges.added.tasks = currTasks.filter(task => !hasTask(task, projects.previous))
        taskChanges.deleted.tasks = prevTasks.filter(task => !projects.current.tasksByCode.has(task.task_code))
        taskChanges.name.tasks = currTasks.filter(task => hasTask(task, projects.previous) && task.task_name !== getTask(task, projects.previous).task_name)
        taskChanges.duration.tasks = currTasks.filter(task => hasTask(task, projects.previous) && task.origDur !== getTask(task, projects.previous).origDur)
        taskChanges.calendar.tasks = currTasks.filter(task => hasTask(task, projects.previous) && task.calendar.clndr_name !== getTask(task, projects.previous).calendar.clndr_name)
        taskChanges.start.tasks = currTasks.filter(task => hasTask(task, projects.previous) && !task.notStarted && !getTask(task, projects.previous).notStarted && task.start.getTime() !== getTask(task, projects.previous).start.getTime()).sort(sortByStart)
        taskChanges.finish.tasks = currTasks.filter(task => hasTask(task, projects.previous) && task.completed && getTask(task, projects.previous).completed && task.finish.getTime() !== getTask(task, projects.previous).finish.getTime()).sort(sortByFinish)
        taskChanges.wbs.tasks = currTasks.filter(task => hasTask(task, projects.previous) && task.wbs.wbsID !== getTask(task, projects.previous).wbs.wbsID)
        document.getElementById("tk").innerText = changeCount(taskChanges).toLocaleString()
        updateElements(taskChanges)

        logicChanges.added.tasks = projects.current.rels.filter(rel => !prevHasLogic(rel))
        logicChanges.deleted.tasks = projects.previous.rels.filter(rel => !projects.current.relsById.has(rel.logicId))
        logicChanges.revised.tasks = projects.current.rels.filter(rel => prevHasLogic(rel) && rel.lag !== getPrevLogic(rel).lag)
        document.getElementById("rl").innerText = changeCount(logicChanges).toLocaleString()
        updateElements(logicChanges)

        resourceChanges.added.tasks = currResources.filter(res => !prevHasRes(res))
        resourceChanges.deleted.tasks = prevResources.filter(res => !currHasRes(res))
        resourceChanges.revisedCost.tasks = currResources.filter(res => prevHasRes(res) && res.target_cost !== getPrevRes(res).target_cost)
        resourceChanges.revisedUnits.tasks = currResources.filter(res => prevHasRes(res) && res.target_qty !== getPrevRes(res).target_qty)
        document.getElementById("rs").innerText = changeCount(resourceChanges).toLocaleString()
        updateElements(resourceChanges)

        constraintChanges.addedPrim.tasks = currTasks.filter(task => hasTask(task, projects.previous) && task.primeConstraint && task.primeConstraint !== getTask(task, projects.previous).primeConstraint)
        constraintChanges.deletedPrim.tasks = prevTasks.filter(task => hasTask(task, projects.current) && task.primeConstraint && task.primeConstraint !== getTask(task, projects.previous).primeConstraint)
        constraintChanges.revisedPrim.tasks = currTasks.filter(task => {
            return (
                hasTask(task, projects.previous) && 
                task.primeConstraint &&
                task.cstr_date &&
                task.primeConstraint === getTask(task, projects.previous).primeConstraint &&
                task.cstr_date.getTime() !== getTask(task, projects.previous).cstr_date.getTime()
            )
        })
        document.getElementById("cs").innerText = changeCount(constraintChanges).toLocaleString()
        updateElements(constraintChanges)

        document.getElementById("start-var").textContent = formatVariance(dateVariance(projects.current.plan_start_date, projects.previous.plan_start_date))
        document.getElementById("dd-var").textContent = formatVariance(dateVariance(projects.current.last_recalc_date, projects.previous.last_recalc_date))
        document.getElementById("end-var").textContent = formatVariance(dateVariance(projects.current.scd_end_date, projects.previous.scd_end_date))
        console.log(dateVariance(projects.current.scd_end_date, projects.previous.scd_end_date))
        document.getElementById("mfb-var").textContent = formatVariance(dateVariance(projects.current.plan_end_date, projects.previous.plan_end_date))
        document.getElementById("tasks-var").textContent = formatVariance((projects.current.tasks.size - projects.previous.tasks.size))
        document.getElementById("not-started-var").textContent = formatVariance((projects.current.notStarted.length - projects.previous.notStarted.length))
        document.getElementById("in-progress-var").textContent = formatVariance((projects.current.inProgress.length - projects.previous.inProgress.length))
        document.getElementById("complete-var").textContent = formatVariance((projects.current.completed.length - projects.previous.completed.length))

        document.getElementById("task-dependent-var").textContent = formatVariance((projects.current.taskDependent.length - projects.previous.taskDependent.length))
        document.getElementById("milestones-var").textContent = formatVariance((projects.current.milestones.length - projects.previous.milestones.length))
        document.getElementById("loe-var").textContent = formatVariance((projects.current.loes.length - projects.previous.loes.length))
        document.getElementById("rsrc-dependent-var").textContent = formatVariance((projects.current.rsrcDependent.length - projects.previous.rsrcDependent.length))

        document.getElementById("critical-var").textContent = formatVariance((projects.current.critical.length - projects.previous.critical.length))
        document.getElementById("near-critical-var").textContent = formatVariance((projects.current.nearCritical.length - projects.previous.nearCritical.length))
        document.getElementById("normal-tf-var").textContent = formatVariance((projects.current.normalFloat.length - projects.previous.normalFloat.length))
        document.getElementById("high-tf-var").textContent = formatVariance((projects.current.highFloat.length - projects.previous.highFloat.length))
        document.getElementById("longest-path-var").textContent = formatVariance((projects.current.longestPath.length - projects.previous.longestPath.length))
        
        document.getElementById("rels-var").textContent = formatVariance((projects.current.rels.length - projects.previous.rels.length))
        document.getElementById("fs-var").textContent = formatVariance((projects.current.fsLogic.length - projects.previous.fsLogic.length))
        document.getElementById("ss-var").textContent = formatVariance((projects.current.ssLogic.length - projects.previous.ssLogic.length))
        document.getElementById("ff-var").textContent = formatVariance((projects.current.ffLogic.length - projects.previous.ffLogic.length))
        document.getElementById("sf-var").textContent = formatVariance((projects.current.sfLogic.length - projects.previous.sfLogic.length))
        
        document.getElementById("schedule-per-var").textContent = formatPercent(projects.current.schedPercentComp - projects.previous.schedPercentComp)
        document.getElementById("physical-per-var").textContent = formatPercent(projects.current.physPercentComp - projects.previous.physPercentComp)
        
        
        if (projects.current.budget && projects.previous.budget) {
            const currCostPer = projects.current.actualCost / projects.current.budget
            const prevCostPer = projects.previous.actualCost / projects.previous.budget
            document.getElementById("cost-per-var").textContent = formatPercent(currCostPer - prevCostPer)
            // document.getElementById("cost-progress").textContent = formatPercent(currCostPer)
        } else {
            document.getElementById("cost-per-var").textContent = "N/A"
        }
        document.getElementById("budget-var").textContent = formatCost(projects.current.budget - projects.previous.budget)
        document.getElementById("actual-cost-var").textContent = formatCost(projects.current.actualCost - projects.previous.actualCost)
        document.getElementById("this-period-var").textContent = formatCost(projects.current.thisPeriodCost - projects.previous.thisPeriodCost)
        document.getElementById("remaining-cost-var").textContent = formatCost(projects.current.remainingCost - projects.previous.remainingCost)
    }
}

function updateProjList(projs, selector) {
    for (let i = selector.options.length - 1; i >= 0; i--) {selector.remove(i);}
    for (const proj in projs) {
        let el = document.createElement("option");
        el.textContent = `${projs[proj].proj_short_name} - ${projs[proj].name}`;
        el.value = projs[proj].proj_id;
        selector.appendChild(el);
    }
    // updateProjCard(selector.name, selector.value)
}

const compCheck = document.getElementById("compare-checkbox");
const fileSelectors = document.querySelectorAll(".xer");
const analyzeButton = document.getElementById("analyze-btn");

analyzeButton.addEventListener("click", (e) => {
    const currSelector = document.getElementById("current-project-selector")
    const prevSelector = document.getElementById("previous-project-selector")
    updateProjCard("current", currSelector.value)
    if (compCheck.checked) { 
        updateProjCard("previous", prevSelector.value)      
    }
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("upload").classList.add("hidden");
    menuClickHandle(event, 'general');
    document.getElementById("dashboard-btn").classList.add("active-btn")
})

const checkIfReady = () => {
    if (!compCheck.checked && !isEmptyObj(tables.current)) {
        return true
    }
    if (compCheck.checked && ! isEmptyObj(tables.current) && !isEmptyObj(tables.previous)) {
        return true
    }
    return false
}


for (let i = 0; i < fileSelectors.length; i++) {
    fileSelectors[i].addEventListener("change", (e) => {
        let reader = new FileReader();
        let projSelector = document.getElementById(`${e.target.name}-project-selector`);
        reader.onload = (r) => {
            tables[e.target.name] = parseFile(r.target.result, e.target.files[0].name);
            updateProjList(tables[e.target.name].PROJECT, projSelector);
            if (Object.keys(tables[e.target.name].PROJECT).length > 1){
                projSelector.classList.remove("hidden")
            } else {
                if (!projSelector.classList.contains("hidden")) {
                    projSelector.classList.add("hidden")
                }
            }
            analyzeButton.disabled = !checkIfReady()
        };
        reader.readAsText(e.target.files[0], "cp1252");
    })
};

const isEmptyObj = obj => Object.keys(obj).length === 0;

compCheck.addEventListener("change", (e) => {
    const baseElements = document.querySelectorAll(".base")
    if (compCheck.checked) {
        baseElements.forEach(el => el.classList.remove("hidden"));
    } else {
        tables.previous = {};
        const selector = document.getElementById("previous-project-selector")
        selector.value = "";
        for (let i = selector.options.length - 1; i >= 0; i--) {selector.remove(i);}
        baseElements.forEach(el => el.classList.add("hidden"));
    }
    analyzeButton.disabled = !checkIfReady()
})