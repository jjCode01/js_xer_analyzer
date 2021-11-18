const addTableRow = (table, values, rowType = "td") => {
    let row = table.insertRow(), cell;
    values.forEach(value => {
        cell = document.createElement(rowType)
        cell.innerHTML = value[0]
        if (value[1]) {cell.classList.add(`txt-${value[1]}`)}
        row.appendChild(cell)
    })
}

const createNewTable = (colHeaders) => {
    let table = document.createElement("table")
    table.classList.add("margin-t-10")
    addTableRow(table, colHeaders, "th")
    return table
}