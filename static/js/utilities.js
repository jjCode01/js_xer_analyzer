// Returns budgeted cost of an object
const budgetedCost = obj => {
    if (!obj.resources) {return 0.0}
    return obj.resources.reduce((accumulator, rsrc) => accumulator + rsrc.target_cost, 0.0)
}

const actualCost = obj => {
    if (!obj.resources) {return 0.0}
    return obj.resources.reduce((accumulator, rsrc) => accumulator + rsrc.act_reg_cost + rsrc.act_ot_cost, 0.0)
}

const thisPeriodCost = obj => {
    if (!obj.resources) {return 0.0}
    return obj.resources.reduce((accumulator, rsrc) => accumulator + rsrc.act_this_per_cost, 0.0)
}

const remainingCost = obj => {
    if (!obj.resources) {return 0.0}
    return obj.resources.reduce((accumulator, rsrc) => accumulator + rsrc.remain_cost, 0.0)
}

const formatDate = dt => {
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return dt.getDate() + "-" + M[dt.getMonth()] + "-" + dt.getFullYear()
}

const dateVarianceDays = (date1, date2) => ((date1.getTime() - date2.getTime()) / (1000 * 3600 *24)).toFixed(0)

const formatCost = cost => {
    return cost.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
}
