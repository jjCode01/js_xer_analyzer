const budgetedCost = obj => obj?.resources?.reduce((a, r) => a + r.target_cost, 0.0) ?? 0.0;
const actualCost = obj => obj?.resources?.reduce((a, r) => a + r.act_reg_cost + r.act_ot_cost, 0.0) ?? 0.0;
const thisPeriodCost = obj => obj?.resources?.reduce((a, r) => a + r.act_this_per_cost, 0.0) ?? 0.0;
const remainingCost = obj => obj?.resources?.reduce((a, r) => a + r.remain_cost, 0.0) ?? 0.0;

const budgetedQty = obj => obj?.resources?.reduce((a, r) => a + r.target_qty, 0.0) ?? 0.0;
const actualQty = obj => obj?.resources?.reduce((a, r) => a + r.act_reg_qty + r.act_ot_qty, 0.0) ?? 0.0;
const thisPeriodQty = obj => obj?.resources?.reduce((a, r) => a + r.act_this_per_qty, 0.0) ?? 0.0;
const remainingQty = obj => obj?.resources?.reduce((a, r) => a + r.remain_qty, 0.0) ?? 0.0;

const formatDate = dt => {
    if (dt instanceof Date && !isNaN(dt)) {
        const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${dt.getDate()}-${M[dt.getMonth()]}-${dt.getFullYear()}`;
    }
    return '';
}

const formatNumber = (num, min = 0, sign = 'never') => {
    const returnString = Intl.NumberFormat('en-US', {
        minimumFractionDigits: min,
        maximumFractionDigits: 2,
        signDisplay: 'never',
    }).format(num);
    return num < 0 ? `(${returnString})` : returnString;
}

const formatVariance = (num) => {
    if (isNaN(num)) {return "N/A"}
    let sign = num === 0 ? "auto" : "always";
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: 1,
        signDisplay: sign,
    }).format(num)
}

const formatCost = cost => formatNumber(cost, 2)

const formatPercent = (value, sign="auto") => {
    const returnString = Intl.NumberFormat('en-US', {
        style: 'percent',
        maximumFractionDigits: 1,
        signDisplay: sign,
    }).format(value)
    return returnString
}

const dateVariance = (date1, date2) => {
    if (!date1 instanceof Date || !date2 instanceof Date || isNaN(date1) || isNaN(date2)) {
        return NaN
    }
    return (date1.getTime() - date2.getTime()) / (1000 * 3600 * 24)
}

function sortByStart(a, b){
    return (a.start.getTime() > b.start.getTime()) ? 1 : (a.start.getTime() === b.start.getTime()) ? ((a.finish.getTime() > b.finish.getTime()) ? 1 : -1) : -1
}

function sortByFinish(a, b){
    return (a.finish.getTime() > b.finish.getTime()) ? 1 : (a.finish.getTime() === b.finish.getTime()) ? ((a.start.getTime() > b.start.getTime()) ? 1 : -1) : -1
}

const sortById = (a, b) => (a.task_code > b.task_code) ? 1 : -1

const isWorkDay = (date, calendar) => {
    return calendar.week[date.getDay()].hours > 0
}
