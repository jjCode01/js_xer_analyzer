let tables = {
    "current": {},
    "previous": {}
}

let projects = {
    // "current": {},
    // "previous": {}
}

let changes = {
    addedTasks: [],
    deletedTasks: [],
    names: [],
    durations: [],
}

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

function formatDate(dt) {
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return dt.getDate() + "-" + M[dt.getMonth()] + "-" + dt.getFullYear()
}

function findChanges(proj1, proj2){
    currTasks = {}
    prevTasks = {}
    proj1.tasks.forEach(t => currTasks[t.task_code] = t)
    proj2.tasks.forEach(t => prevTasks[t.task_code] = t)

    // Find task changes
    Object.entries(currTasks).forEach(([key, task]) => {
        if (!prevTasks[key]){changes.addedTasks.push(task)}  // Found Added Task
        else{
            const prev = prevTasks[key]
            if (task.task_name != prev.task_name){  // Found Name Change
                changes.names.push({current: task, previous: prev})
            }

            if (task.target_drtn_hr_cnt != prev.target_drtn_hr_cnt){
                changes.durations.push({current: task, previous: prev})
            }
        }
    })

    // Find deleted tasks
    Object.entries(prevTasks).forEach(([key, val]) => {
        if (!currTasks[key]){
            changes.deletedTasks.push(val)
        }
    })
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

document.getElementById('compare').addEventListener("click", () => {
    if (projects.current && projects.previous) {
        findChanges(projects.current, projects.previous)
        // changes.addedTasks.rows.forEach(t => console.log(`${t.task_code} - ${t.task_name}`))
        changes.names.forEach(t => console.log(`${t.current.task_code} - ${t.current.task_name} --- ${t.previous.task_name}`))
    }
})
