// Returns budgeted cost of an object
const budgetedCost = obj => {
    if (!obj.resources) {return 0.0}
    return obj.resources.reduce((accumulator, rsrc) => accumulator + rsrc.target_cost, 0.0)
}

const actualCost = obj => {
    if (!obj.resources) {return 0.0}
    return obj.resources.reduce((accumulator, rsrc) => accumulator + rsrc.act_reg_cost + rsrc.act_ot_cost, 0.0)
}

const formatDate = dt => {
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return dt.getDate() + "-" + M[dt.getMonth()] + "-" + dt.getFullYear()
}