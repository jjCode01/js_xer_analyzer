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
    
    document.getElementById(`${el.name}-start`).innerHTML = formatDate(proj['plan_start_date'])
    document.getElementById(`${el.name}-data-date`).innerHTML = formatDate(proj['last_recalc_date'])
    document.getElementById(`${el.name}-end`).innerHTML = formatDate(proj['scd_end_date'])

    if (proj.plan_end_date){
        document.getElementById(`${el.name}-mfb`).innerHTML = formatDate(proj['plan_end_date'])
    }
    else {
        document.getElementById(`${el.name}-mfb`).innerHTML = "None"
    }

    document.getElementById(`${el.name}-budget`).innerHTML = formatCost(budgetedCost(proj))
    document.getElementById(`${el.name}-actual-cost`).innerHTML = formatCost(actualCost(proj))
    document.getElementById(`${el.name}-this-period`).innerHTML = formatCost(thisPeriodCost(proj))
    document.getElementById(`${el.name}-remaining-cost`).innerHTML = formatCost(remainingCost(proj))
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

function clickHandle(evt, id) {
    let x, tablinks;
    x = document.getElementsByClassName("cat");
    for (let i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active-btn", "");
    }
    document.getElementById(id).style.display = "grid";
    evt.currentTarget.classList.add("active-btn");
}

document.getElementById('compare').addEventListener("click", () => {
    if (projects.current && projects.previous) {
        document.getElementById("upload").classList.add("hidden")
        document.getElementById("changes-btn").classList.toggle("hidden")
        document.getElementById("updates-btn").classList.toggle("hidden")
        taskChanges = findTaskChanges(projects.current, projects.previous)
        logicChanges = findLogicChanges(projects.current, projects.previous)
        rsrcChanges = findResourceChanges(projects.current, projects.previous)
        updates = findUpdates(projects.current, projects.previous)

        let startVar = projects.current.plan_start_date.getTime() - projects.previous.plan_start_date.getTime()
        startVar = startVar / (1000 * 3600 * 24)
        document.getElementById("start-var").innerHTML = startVar

        let ddVar = projects.current.last_recalc_date.getTime() - projects.previous.last_recalc_date.getTime()
        ddVar = ddVar / (1000 * 3600 * 24)
        document.getElementById("dd-var").innerHTML = ddVar

        let endVar = projects.current.scd_end_date.getTime() - projects.previous.scd_end_date.getTime()
        endVar = endVar / (1000 * 3600 * 24)
        document.getElementById("end-var").innerHTML = endVar

        let budgetVar = budgetedCost(projects.current) - budgetedCost(projects.previous)
        document.getElementById("budget-var").innerHTML = formatCost(budgetVar)

        let actualVar = actualCost(projects.current) - actualCost(projects.previous)
        document.getElementById("actual-cost-var").innerHTML = formatCost(actualVar)

        let thisPeriodVar = thisPeriodCost(projects.current) - thisPeriodCost(projects.previous)
        document.getElementById("this-period-var").innerHTML = formatCost(thisPeriodVar)

        let remainingVar = remainingCost(projects.current) - remainingCost(projects.previous)
        document.getElementById("remaining-cost-var").innerHTML = formatCost(remainingVar)

        if (projects.current.plan_end_date && projects.previous.plan_end_date) {
            let mfbVar = projects.current.plan_end_date.getTime() - projects.previous.plan_end_date.getTime()
            mfbVar = mfbVar / (1000 * 3600 * 24)
            document.getElementById("mfb-var").innerHTML = mfbVar
        } else {
            document.getElementById("mfb-var").innerHTML = "N/A"
        }

        for (let change in taskChanges){
            if (taskChanges[change].rows.length) {
                document.getElementById('yes-changes').appendChild(createCard(taskChanges[change]))
            }
            else {
                document.getElementById('no-changes').appendChild(createCard(taskChanges[change]))
            }
        }

        for (let change in logicChanges){
            if (logicChanges[change].rows.length) {
                document.getElementById('yes-changes').appendChild(createCard(logicChanges[change]))
            }
            else {
                document.getElementById('no-changes').appendChild(createCard(logicChanges[change]))
            }
        }

        for (let change in rsrcChanges){
            if (rsrcChanges[change].rows.length) {
                document.getElementById('yes-changes').appendChild(createCard(rsrcChanges[change]))
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
