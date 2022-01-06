const checkLongestPath = task => task.longestPath ? '\u2611' : '\u2610';

let updates = {
    started: {
        id: "ud-started",
        title: 'Activities Started',
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Start', 'Finish'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, 
                formatDate(task.start), formatDate(task.finish)
            ])
        }
    },
    finished: {
        id: "ud-finished",
        title: "Activities Finished",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Start', 'Finish'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), 
                formatDate(task.finish)
            ])
        }
    },
    startFinish: {
        id: "ud-startFinish",
        title: "Activities Started and Finished",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Start', 'Finish'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), 
                formatDate(task.finish)
            ])
        }
    },
    percent: {
        id: "ud-percent",
        title: "Updated Percent Completes",
        align: ['left', 'left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Percent\r\nType', '% Comp', 'Prev\r\n% Comp', 'Var'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.percentType, 
                formatPercent(task.percent), formatPercent(getTask(task, projects.previous).percent), 
                formatPercent(task.percent - getTask(task, projects.previous).percent, 'always')
            ])
        }
    },
    duration: {
        id: "ud-duration",
        title: "Updated Remaining Durations",
        align: ['left', 'left', 'left', 'center', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 
            'Rem\r\nDur', 'Prev\r\nRem\r\nDur', 'Var'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatNumber(task.origDur), 
                formatNumber(task.remDur), formatNumber(getTask(task, projects.previous).remDur), 
                formatVariance(task.remDur - getTask(task, projects.previous).remDur)
            ])
        }
    },
    cost: {
        id: "ud-cost",
        title: "Updated Actual Cost",
        align: ['left', 'left', 'left', 'right', 'right', 'right', 'right'],
        columns: [
            'Act ID', 'Act Name', 'Status', 'Budgeted\r\nCost', 
            'Actual\r\nCost', 'Prev\r\nActual\r\nCost', 'Var'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatCost(budgetedCost(task)), 
                formatCost(actualCost(task)), formatCost(actualCost(getTask(task, projects.previous))), 
                formatCost(actualCost(task) - actualCost(getTask(task, projects.previous)))
            ])
        }
    },
    regress: {
        id: "ud-regress",
        title: "Regressive Updates",
        align: [
            'left', 'left', 'left', 'left', 'center', 'center', 
            'center', 'center', 'center', 'center', 'center'
        ],
        columns: [
            'Act ID', 'Act Name', 'Status', 'Prev\r\nStatus', 'Orig\r\nDur', 
            'Rem\r\nDur', 'Prev\r\nRem\r\nDur', 'RD\r\nVar', '%\r\nComp', 
            'Prev\r\n%\r\nComp', '%\r\nVar'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, 
                getTask(task, projects.previous).status, task.origDur, 
                task.remDur, getTask(task, projects.previous).remDur, 
                formatVariance(task.remDur - getTask(task, projects.previous).remDur),
                formatPercent(task.percent), formatPercent(getTask(task, projects.previous).percent), 
                formatPercent(task.percent - getTask(task, projects.previous).percent, 'always')
            ])
        }
    }
}

let taskChanges = {
    added: {
        id: "tk-added",
        title: "Added Activities",
        align: ['left', 'left', 'left', 'center', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 
            'Start', 'Finish', 'Longest\r\nPath'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.origDur, 
                formatDate(task.start), formatDate(task.finish), checkLongestPath(task)
            ])
        }
    },
    deleted: {
        id: "tk-deleted",
        title: "Deleted Activities",
        align: ['left', 'left', 'left', 'center', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 
            'Start', 'Finish', 'Longest\r\nPath'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.origDur, 
                formatDate(task.start), formatDate(task.finish), checkLongestPath(task)
            ])
        }
    },
    name: {
        id: "tk-name",
        title: "Revised Activity Names",
        align: ['left', 'left', 'left'],
        columns: ['Act ID', 'Act Name', 'Prev Name'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, getTask(task, projects.previous).task_name
            ])
        }
    },
    duration: {
        id: "tk-duration",
        title: "Revised Original Durations",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'Orig\r\nDur', 'Prev\r\nOrig\r\nDur', 'Var'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatNumber(task.origDur), 
                formatNumber(getTask(task, projects.previous).origDur), 
                formatVariance(task.origDur - getTask(task, projects.previous).origDur)
            ])
        }
    },
    calendar: {
        id: "tk-calendar",
        title: "Revised Activity Calendars",
        align: ['left', 'left', 'left', 'left', 'left'],
        columns: ['Act ID', 'Act Name', 'Status', 'Calendar', 'Prev\r\nCalendar'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.calendar.clndr_name, 
                getTask(task, projects.previous).calendar.clndr_name 
            ])
        }
    },
    start: {
        id: "tk-start",
        title: "Revised Actual Starts",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Act Name', 'Status', 'Actual\r\nStart', 
            'Prev\r\nActual\r\nStart', 'Var'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), 
                formatDate(getTask(task, projects.previous).start), 
                formatVariance(dateVariance(task.start, getTask(task, projects.previous).start))
            ])
        }
    },
    finish: {
        id: "tk-finish",
        title: "Revised Actual Finishes",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Act Name', 'Status', 'Actual\r\nFinish', 
            'Prev\r\nActual\r\nFinish', 'Var'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.finish), 
                formatDate(getTask(task, projects.previous).finish), 
                formatVariance(dateVariance(task.finish, getTask(task, projects.previous).finish))
            ])
        }
    },
    wbs: {
        id: "tk-wbs",
        title: "Revised WBS Assignment",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: ['Act ID', 'Act Name', 'Status', 'WBS', 'Prev\r\nWBS'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.wbs.wbsID, 
                getTask(task, projects.previous).wbs.wbsID
            ])
        }
    },
}

let logicChanges = {
    added: {
        id: "rl-added",
        title: "Added Relationships",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: [
            'Pred ID', 'Predecessor Name', 
            'Succ ID', 'Successor Name', 'Link', 'Lag'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.predTask.task_code, task.predTask.task_name, 
                task.succTask.task_code, task.succTask.task_name, task.link, task.lag 
            ])
        }
    },
    deleted: {
        id: "rl-deleted",
        title: "Deleted Relationships",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: [
            'Pred ID', 'Predecessor Name', 
            'Succ ID', 'Successor Name', 'Link', 'Lag'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.predTask.task_code, task.predTask.task_name, 
                task.succTask.task_code, task.succTask.task_name, task.link, task.lag 
            ])
        }
    },
    revised: {
        id: "rl-revised",
        title: "Revised Relationships",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: [
            'Pred ID', 'Predecessor Name', 
            'Succ ID', 'Successor Name', 'Link:Lag', 'Prev\r\nLink:Lag'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.predTask.task_code, task.predTask.task_name, 
                task.succTask.task_code, task.succTask.task_name, 
                `${task.link}:${task.lag}`, `${getPrevLogic(task).link}:${getPrevLogic(task).lag}` 
            ])
        }
    },
}

let resourceChanges = {
    added: {
        id: "rs-added",
        title: "Added Resources",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Resource', 'Budgeted\r\nQty', 'Budgeted\r\nCost'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task.task_code, task.task.task_name, task.task.status, 
                task.rsrcName, formatNumber(task.target_qty), formatCost(task.target_cost)
            ])
        }
    },
    deleted: {
        id: "rs-deleted",
        title: "Deleted Resources",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Resource', 'Budgeted\r\nQty', 'Budgeted\r\nCost'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task.task_code, task.task.task_name, task.task.status, 
                task.rsrcName, formatNumber(task.target_qty), formatCost(task.target_cost)
            ])
        }
    },
    revisedCost: {
        id: "rs-cost",
        title: "Revised Resource Cost",
        align: ['left', 'left', 'left', 'left', 'right', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Resource', 'Budgeted\r\nCost', 'Prev\r\nBudgeted\r\nCost', 'Var'
        ],
        data: [],
        getRows: function() {
            return this.data.map(res => {
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
        id: "rs-units",
        title: "Revised Resource Quantity",
        align: ['left', 'left', 'left', 'left', 'right', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nQty', 
            'Prev\r\nBudgeted\r\nQty', 'Var'
        ],
        data: [],
        getRows: function() {
            return this.data.map(res => {
                const prevQty = getPrevRes(res).target_qty;
                return [
                    res.task.task_code, res.task.task_name, res.task.status, res.rsrcName, 
                    formatNumber(res.target_qty), formatNumber(prevQty), 
                    formatVariance(res.target_qty - prevQty)
                ]
            })
        }
    },
}

let constraintChanges = {
    addedPrim: {
        id: "cs-added-prim",
        title: "Added Primary Constraints",
        align: ['left', 'left', 'left', 'left', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Primary\r\nConstraint', 'Date'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, 
                task.primeConstraint, formatDate(task.cstr_date)
            ])
        }
    },
    addedSec: {
        id: "cs-added-sec",
        title: "Added Secondary Constraints",
        align: ['left', 'left', 'left', 'left', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Secondary\r\nConstraint', 'Date'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, 
                task.secondConstraint, formatDate(task.cstr_date2)
            ])
        }
    },
    deletedPrim: {
        id: "cs-deleted-prim",
        title: "Deleted Primary Constraints",
        align: ['left', 'left', 'left', 'left', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Primary\r\nConstraint', 'Date'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, 
                task.primeConstraint, formatDate(task.cstr_date)
            ])
        }
    },
    deletedSec: {
        id: "cs-deleted-sec",
        title: "Deleted Secondary Constraints",
        align: ['left', 'left', 'left', 'left', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Secondary\r\nConstraint', 'Date'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, 
                task.secondConstraint, formatDate(task.cstr_date2)
            ])
        }
    },
    revisedPrim: {
        id: "cs-revised-prim",
        title: "Revised Primary Constraint Dates",
        align: ['left', 'left', 'left', 'left', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Constraint', 
            'Date', 'Prev\r\nDate', 'Var\r\n(Days)'],
        data: [],
        getRows: function() {
            return this.data.map(task => {
                const prevDate = getTask(task, projects.previous).cstr_date
                const variance = (
                    (task.cstr_date && prevDate) ? dateVariance(task.cstr_date, prevDate) : "N/A"
                )
                return [
                    task.task_code, task.task_name, task.status, task.primeConstraint, 
                    formatDate(task.cstr_date), formatDate(getTask(task, projects.previous).cstr_date), 
                    formatVariance(variance)
                ]
            })
        }
    },
    revisedSec: {
        id: "cs-revised-sec",
        title: "Revised Secondary Constraint Dates",
        align: ['left', 'left', 'left', 'left', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Constraint', 
            'Date', 'Prev\r\nDate', 'Var\r\n(Days)'],
        data: [],
        getRows: function() {
            return this.data.map(task => {
                const prevDate = getTask(task, projects.previous).cstr_date2
                const variance = (
                    (task.cstr_date2 && prevDate) ? dateVariance(task.cstr_date2, prevDate) : "N/A"
                )
                return [
                    task.task_code, task.task_name, task.status, task.secondConstraint, 
                    formatDate(task.cstr_date2), formatDate(getTask(task, projects.previous).cstr_date2), 
                    formatVariance(variance)
                ]
            })
        }
    },
}

let openEnds = {
    predecessor: {
        id: "open-pred",
        title: "Activities With No Predecessor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    },
    successor: {
        id: "open-succ",
        title: "Activities With No Successor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    },
    start: {
        id: "open-start",
        title: "Activities With No Start (SS or FS) Predecessor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    },
    finish: {
        id: "open-finish",
        title: "Activities With No Finish (FS or FF) Successor",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Type'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, task.taskType
            ])
        }
    },
    duplicate: {
        id: "open-duplicate",
        title: "Duplicate Relationships",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: [
            'Pred ID', 'Predecessor Name', 'Succ ID', 'Successor Name', 
            "Link:Lag", "Duplicate\r\nLink:Lag"
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task[0].predTask.task_code, task[0].predTask.task_name, 
                task[0].succTask.task_code, task[0].succTask.task_name,
                `${task[0].link}:${task[0].lag}`, `${task[1].link}:${task[1].lag}`
            ])
        }
    }
}

let dateWarnings = {
    start: {
        id: "inv-start",
        title: "Activities With Actual Start on or After Data Date",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Actual\r\nStart', 'Data\r\nData'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.start), 
                formatDate(projects.current.last_recalc_date)
            ])
        }
    },
    finish: {
        id: "inv-finish",
        title: "Activities With Actual Finish on or After Data Date",
        align: ['left', 'left', 'left', 'center', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Actual\r\nFinish', 'Data\r\nData'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.finish), 
                formatDate(projects.current.last_recalc_date)
            ])
        }
    },
    expected: {
        id: "inv-expected",
        title: "Activities With an Expected Finish Date",
        align: ['left', 'left', 'left', 'center', 'center', 'center'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Expected\r\nFinish', 
            'Orig\r\nDur', 'Rem\r\nDur'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.expect_end_date), 
                formatNumber(task.origDur), formatNumber(task.remDur)
            ])
        }
    },
    suspend: {
        id: "inv-suspend",
        title: "Activities With Suspend / Resume Dates",
        align: ['left', 'left', 'left', 'left', 'center', 'center'],
        columns: ['Act ID', 'Activity Name', 'Status', 'Suspend', 'Resume'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.status, formatDate(task.suspend_date), 
                formatDate(task.resume_date)
            ])
        }
    }
}

let durWarnings = {
    long: {
        id: "dur-long",
        title: "Construction Activities With Original Durations Greater than 20 Days",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: ['Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur'],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, 
                task.calendar.clndr_name, task.origDur
            ])
        }
    },
    short: {
        id: "dur-short",
        title: "Activities With Original Durations Equal to 1 Day",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, 
                task.calendar.clndr_name, task.origDur
            ])
        }
    },
    zero: {
        id: "dur-zero",
        title: "Activities With Original Durations Equal to 0 Days",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Act Type', 'Status', 'Cal', 'Orig\r\nDur'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, 
                task.calendar.clndr_name, task.origDur
            ])
        }
    },
    rdzero: {
        id: "dur-rdzero",
        title: "Incomplete Activities with Zero Remaining Duration",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Act Type', 'Status', 
            'Cal', 'Orig\r\nDur', 'Rem\r\nDur'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, 
                task.calendar.clndr_name, task.origDur, task.remDur
            ])
        }
    },
    odrd: {
        id: "dur-odrd",
        title: "Open Activities With Unequal Original and Remaining Durations",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Act Type', 'Status', 
            'Cal', 'Orig\r\nDur', 'Rem\r\nDur'
        ],
        data: [],
        getRows: function() {
            return this.data.map(task => [
                task.task_code, task.task_name, task.taskType, task.status, 
                task.calendar.clndr_name, task.origDur, task.remDur
            ])
        }
    }
}

let costWarnings = {
    budget: {
        id: "cost-budget",
        title: "Budgeted Cost Differs from At Completion Cost",
        align: ['left', 'left', 'left', 'left', 'right', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Resource', 'Budgeted\r\nCost', 
            'At Completion\r\nCost', 'Variance'
        ],
        data: [],
        getRows: function() {
            return this.data.map(res => {
                return [
                    res.task.task_code, res.task.task_name, res.task.status, 
                    res.rsrcName, formatCost(res.target_cost), formatCost(res.atCompletionCost), 
                    formatCost(res.atCompletionCost - res.target_cost)
                ]
            })
        }
    },
    earned: {
        id: "cost-ev",
        title: "Actual Cost to Date Differs from Earned Value",
        align: ['left', 'left', 'left', 'left', 'center', 'right', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 'Resource', '%\r\nComp', 
            'Actual\r\nCost', 'Earned\r\nValue', 'Variance'],
        data: [],
        getRows: function() {
            return this.data.map(res => {
                return [
                    res.task.task_code, res.task.task_name, res.task.status, 
                    res.rsrcName, formatPercent(res.task.percent), formatCost(res.actualCost), 
                    formatCost(res.earnedValue), formatCost(res.actualCost - res.earnedValue)
                ]
            })
        }
    },
    regress: {
        id: "cost-regress",
        title: "Regressive This Period Cost",
        align: ['left', 'left', 'left', 'left', 'right', 'right'],
        columns: [
            'Act ID', 'Activity Name', 'Status', 
            'Resource', 'Budgeted\r\nCost', 'This Period\r\nCost'
        ],
        data: [],
        getRows: function() {
            return this.data.map(res => {
                return [
                    res.task.task_code, res.task.task_name, res.task.status, 
                    res.rsrcName, formatCost(res.target_cost), formatCost(res.act_this_per_cost)
                ]
            })
        }
    }
}
