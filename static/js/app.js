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

const formatDate = dt => {
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return dt.getDate() + "-" + M[dt.getMonth()] + "-" + dt.getFullYear()
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
        updateProjCard(e.target)
    })
}

let changes = {}

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
    div.classList.add("card", "pad-1em", "border-rad-5", "box-shadow", "margin-10", "margin-v-20")
    const title = document.createElement("h3")
    title.classList.add("f14")
    title.innerHTML = `${change.desc}: ${change.rows.length}`
    div.appendChild(title)
    if (change.rows.length){
        const table = createTable(change.labels)
        change.rows.forEach((task, i) => {
            row = table.insertRow()
            if (!(i % 2)) {row.classList.add("oddRow")}
            task.forEach(value => {
                cell = row.insertCell()
                cell.innerHTML = value
            })
        })
        div.appendChild(table)
    }
    return div
}

document.getElementById('compare').addEventListener("click", () => {
    if (projects.current && projects.previous) {
        document.getElementById("upload").classList.add("hidden")
        changes = findTaskChanges(projects.current, projects.previous)

        for (change in changes){
            document.getElementById('changes').appendChild(createCard(changes[change]))
        }

        // Added tasks
        // let card = new CardDiv(`Added Tasks: ${changes.addedTasks.length}`)
        // if (changes.addedTasks.length) {
        //     let addedTaskTable = createTable(["ID", "Task Name"])
        //     changes.addedTasks.forEach((task, i) => {
        //         row = addedTaskTable.insertRow()
        //         if (!(i % 2)) {row.classList.add("oddRow")}
        //         ['task_code', 'task_name'].forEach(value => {
        //             cell = row.insertCell()
        //             cell.innerHTML = task[value]
        //         })
        //     })
        //     card.div.appendChild(addedTaskTable)
        // }
        // document.getElementById('changes').appendChild(card.div)

        // Deleted tasks
        // div = createCard(`Deleted Tasks: ${changes.deletedTasks.length}`)
        // if (changes.deletedTasks.length){
        //     let deletedTaskTable = createTable(["ID", "Task Name"])
        //     changes.deletedTasks.forEach((task, i) => {
        //         row = deletedTaskTable.insertRow()
        //         if (!(i % 2)) {row.classList.add("oddRow")}
        //         ['task_code', 'task_name'].forEach(value => {
        //             cell = row.insertCell()
        //             cell.innerHTML = task[value]
        //         })
        //     })
        //     div.appendChild(deletedTaskTable)
        // }
        // document.getElementById('changes').appendChild(div)

        // Name changes
        // div = createCard(`Task Name Changes: ${changes.names.length}`)
        // if (changes.names.length){
        //     let nameChangeTable = createTable(["ID", "New Name", "Old Name"])
        //     changes.names.forEach((task, i) => {
        //         row = nameChangeTable.insertRow()
        //         if (!(i % 2)) {row.classList.add("oddRow+")}
        //     })

        //     div.appendChild(nameChangeTable)
        // }
        // document.getElementById('changes').appendChild(div)
    }
})
