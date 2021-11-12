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
    let row = table.insertRow(), cell;
    columns.forEach(value => {
        cell = document.createElement("th")
        cell.innerHTML = value
        row.appendChild(cell)
    })
    return table
}

const createCard = description => {
    let div = document.createElement("div")
    div.classList.add("card", "pad-1em", "border-rad-5", "box-shadow", "margin-10", "margin-v-20")
    let title = document.createElement("h3")
    title.innerHTML = description
    div.appendChild(title)
    return div
}

document.getElementById('compare').addEventListener("click", () => {
    if (projects.current && projects.previous) {
        changes = findTaskChanges(projects.current, projects.previous)

        // Added tasks
        let div = createCard(`Added Tasks: ${changes.addedTasks.length}`)
        // let div = document.createElement("div")
        // div.classList.add("card", "pad-1em", "border-rad-5", "box-shadow", "margin-10", "margin-v-20")
        if (changes.addedTasks) {
            let addedTaskTable = createTable(["ID", "Task Name"])
            changes.addedTasks.forEach(task => {
                row = addedTaskTable.insertRow();
                ['task_code', 'task_name'].forEach(value => {
                    cell = row.insertCell()
                    cell.innerHTML = task[value]
                })
            })
            div.appendChild(addedTaskTable)
        }
        document.getElementById('changes').appendChild(div)

        // Deleted tasks
        div = createCard(`Deleted Tasks: ${changes.deletedTasks.length}`)
        // div = document.createElement("div")
        // div.classList.add("card", "pad-1em", "border-rad-5", "box-shadow", "margin-10", "margin-v-20")
        if (changes.deletedTasks){
            let deletedTaskTable = createTable(["ID", "Task Name"])

            div.appendChild(deletedTaskTable)
        }
        document.getElementById('changes').appendChild(div)

        // Name changes
        div = createCard(`Task Name Changes: ${changes.names.length}`)
        // div = document.createElement("div")
        // div.classList.add("card", "pad-1em", "border-rad-5", "box-shadow", "margin-10", "margin-v-20")
        if (changes.names){
            let nameChangeTable = createTable(["ID", "New Name", "Old Name"])

            div.appendChild(nameChangeTable)
        }
        document.getElementById('changes').appendChild(div)

        // console.log("\nAdded Tasks")
        // changes.addedTasks.forEach(t => console.log(`${t.task_code} - ${t.task_name}`))

        // console.log("\nDeleted Tasks")
        // changes.deletedTasks.forEach(t => console.log(`${t.task_code} - ${t.task_name}`))

        // console.log("\nTask Name Changes")
        // changes.names.forEach(t => console.log(`${t.current.task_code} - ${t.current.task_name} <==> ${t.previous.task_name}`))

        // console.log("\nOriginal Duration Changes")
        // changes.durations.forEach(t => console.log(`${t.current.task_code} - ${t.current.task_name} | ${t.current.target_drtn_hr_cnt / 8} <==> ${t.previous.target_drtn_hr_cnt / 8}`))

        // console.log("\nCalendar Changes")
        // changes.calendars.forEach(t => console.log(`${t.current.task_code} - ${t.current.task_name} | ${t.current.calendar.clndr_name} <==> ${t.previous.calendar.clndr_name}`))

        // console.log("\nActual Start Changes")
        // changes.actualStarts.forEach(t => console.log(`${t.current.task_code} - ${t.current.task_name} | ${formatDate(t.current.start)} <==> ${formatDate(t.previous.start)}`))
        
        // console.log("\nActual Finish Changes")
        // changes.actualFinishes.forEach(t => console.log(`${t.current.task_code} - ${t.current.task_name} | ${formatDate(t.current.finish)} <==> ${formatDate(t.previous.finish)}`))
    }
})
