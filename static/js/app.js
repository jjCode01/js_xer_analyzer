// app.js

/*
TODO:
    
*/



let tables = {
    "current": {},
    "previous": {}
}

let projects = {}

function updateProjCard(el){
    let proj = tables[el.name]["PROJECT"][el.value]
    projects[el.name] = proj
    document.getElementById(`${el.name}-project-id`).innerHTML = proj['proj_short_name']
    document.getElementById(`${el.name}-project-name`).innerHTML = proj['proj_long_name']
    document.getElementById(`${el.name}-dd`).innerHTML = formatDate(proj['last_recalc_date'])
}

function updateProjList(projects, selector) {
    for(let i = selector.options.length - 1; i >= 0; i--) {selector.remove(i);}
    for (const proj in projects){
        let p = projects[proj]
        let el = document.createElement("option")
        el.textContent = `${p['proj_short_name']} - ${p['proj_long_name']}`
        el.value = p['proj_id']
        selector.appendChild(el)
    }
    updateProjCard(selector)
}

// const formatDate = dt => {
//     const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
//     return dt.getDate() + "-" + M[dt.getMonth()] + "-" + dt.getFullYear()
// }

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
        updateProjCard(e.target)
    })
}

let taskChanges = {}
let logicChanges = {}
let rsrcChanges = {}
let updates = {}

const createTable = columns => {
    let table = document.createElement("table")
    table.classList.add("margin-t-10")
    let row = table.insertRow(), cell;
    columns.forEach(value => {
        cell = document.createElement("th")
        cell.innerHTML = value
        row.appendChild(cell)
    })
    return table
}

const createCard = change => {
    const div = document.createElement("div")
    const title = document.createElement("h3")
    if (change.rows.length) {
        div.classList.add("card", "pad-1em", "border-rad-5", "box-shadow", "margin-10", "margin-v-20")
        title.classList.add("f14", "collapsible", "cursor-pointer")
    }
    else {
        div.classList.add("card", "pad-h-1em", "margin-10", "f-reg")
        title.classList.add("f14", "f-reg")
    }

    title.innerHTML = `${change.desc}: ${change.rows.length}`
    div.appendChild(title)
    if (change.rows.length){
        const innerDiv = document.createElement("div")
        innerDiv.classList.add("data")
        const table = createTable(change.labels)
        change.rows.forEach((task, i) => {
            row = table.insertRow()
            if (!(i % 2)) {row.classList.add("oddRow")}
            task.forEach(value => {
                cell = row.insertCell()
                cell.innerHTML = value
            })
        })
        innerDiv.appendChild(table)
        div.appendChild(innerDiv)
    }
    return div
}

document.getElementById('compare').addEventListener("click", () => {
    if (projects.current && projects.previous) {
        document.getElementById("upload").classList.add("hidden")
        taskChanges = findTaskChanges(projects.current, projects.previous)
        logicChanges = findLogicChanges(projects.current, projects.previous)
        rsrcChanges = findResourceChanges(projects.current, projects.previous)
        updates = findUpdates(projects.current, projects.previous)

        for (let change in taskChanges){
            if (taskChanges[change].rows.length) {
                document.getElementById('changes').appendChild(createCard(taskChanges[change]))
            }
            else {
                document.getElementById('no-changes').appendChild(createCard(taskChanges[change]))
            }
        }

        for (let change in logicChanges){
            if (logicChanges[change].rows.length) {
                document.getElementById('changes').appendChild(createCard(logicChanges[change]))
            }
            else {
                document.getElementById('no-changes').appendChild(createCard(logicChanges[change]))
            }
        }

        for (let change in rsrcChanges){
            if (rsrcChanges[change].rows.length) {
                document.getElementById('changes').appendChild(createCard(rsrcChanges[change]))
            }
            else {
                document.getElementById('no-changes').appendChild(createCard(rsrcChanges[change]))
            }
        }

        for (let update in updates){
            if (updates[update].rows.length) {
                document.getElementById('yes-updates').appendChild(createCard(updates[update]))
            }
            else {
                document.getElementById('no-updates').appendChild(createCard(updates[update]))
            }
        }

        const coll = document.getElementsByClassName("collapsible");

        for (let i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function() {
                const content = this.nextElementSibling;
                if (content.style.maxHeight){
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                } 
            });
        }
    }
})
