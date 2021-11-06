let tables = {
    "current": {},
    "previous": {}
}

function updateProjCard(el){
    let proj = tables[el.name]["PROJECT"][el.value]
    document.getElementById(`${el.name}-project-id`).innerHTML = proj['proj_short_name']
    document.getElementById(`${el.name}-project-name`).innerHTML = proj['proj_long_name']
    document.getElementById(`${el.name}-data-date`).innerHTML = formatDate(proj['last_recalc_date'])
}

function updateProjList(projects, selector) {
    for(let i = selector.options.length - 1; i >= 0; i--) {
        selector.remove(i);
    }
    for (const proj in projects){
        let p = projects[proj]
        let el = document.createElement("option")
        el.textContent = `${p['proj_short_name']} - ${p['proj_long_name']}`
        el.value = p['proj_id']
        selector.appendChild(el)
    }
    updateProjCard(selector)
}

function setDataType(col, val) {
    if (val == ''){return}
    if (col.endsWith('_date') || col.endsWith('_date2')){return new Date(val.split(" ").join("T"))}
    if (col.endsWith('_num')){return parseInt(val)}
    for (c in ['_cnt', '_qty', '_cost']){
        if (col.endsWith(c)){return parseFloat(val)}
    }
    return val
}

function formatDate(dt) {
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return dt.getDate() + "-" + M[dt.getMonth()] + "-" + dt.getFullYear()
}

function parseFile(file){
    let tables = {}
    let currTable = ''
    let columns = []
    let lines = file.split("\n");
    for(let line = 0; line < lines.length; line++){
        let cols = lines[line].trim().split('\t')
        if (cols[0] == "%T") {
            currTable = cols[1]
            tables[currTable] = {}
        }
        else if(cols[0] == "%F"){columns = cols}
        else if(cols[0] == "%R"){
            let row = {}
            columns.forEach((k, i) => {row[k] = setDataType(k, cols[i])})

            if (currTable == "PROJECT"){
                tables['PROJECT'][row['proj_id']] = row
                tables['PROJECT'][row['proj_id']]['tasks'] = []
            }
            if (currTable == "PROJWBS"){
                if (row['proj_node_flag'] == "Y"){
                    tables['PROJECT'][row['proj_id']]['proj_long_name'] = row['wbs_name']
                }
            }
            if (currTable == "TASK"){
                tables['PROJECT'][row['proj_id']]['tasks'].push(row)
            }
        }
    }
    return tables
}

let fileSelectors = document.getElementsByTagName("input")
for (let i = 0; i < fileSelectors.length; i++){
    fileSelectors[i].addEventListener("change", (e) => {
        let reader = new FileReader();
        let projSelector = document.getElementById(`${e.target.name}-project-selector`)
        reader.onload = (r) => {
            tables[e.target.name] = parseFile(r.target.result)
            updateProjList(tables[e.target.name]['PROJECT'], projSelector)
        };
        reader.readAsText(e.target.files[0], "cp1252");
    })
}

let projSelectors = document.getElementsByTagName('select')
for (let i = 0; i < projSelectors.length; i++) {
    projSelectors[i].addEventListener("change", (e) => {
        let proj = tables[e.target.name]["PROJECT"][e.target.value]
        document.getElementById(`${e.target.name}-project-id`).innerHTML = proj['proj_short_name']
        document.getElementById(`${e.target.name}-project-name`).innerHTML = proj['proj_long_name']
        document.getElementById(`${e.target.name}-data-date`).innerHTML = formatDate(proj['last_recalc_date'])
    })
}
