function setDataType(col, val) {
    if (val == ''){return}
    if (col.endsWith('_date') || col.endsWith('_date2')){return new Date(val.split(" ").join("T"))}
    if (col.endsWith('_num')){return parseInt(val)}
    for (c in ['_cnt', '_qty', '_cost']){
        if (col.endsWith(c)){return parseFloat(val)}
    }
    return val
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
                tables['PROJECT'][row['proj_id']].tasks = []
                tables['PROJECT'][row['proj_id']].rels = []
            }
            if (currTable == "PROJWBS"){
                if (row['proj_node_flag'] == "Y"){
                    tables['PROJECT'][row['proj_id']]['proj_long_name'] = row['wbs_name']
                }
            }
            if (currTable == "TASK"){tables['PROJECT'][row['proj_id']].tasks.push(row)}
            if (currTable == "TASKPRED"){tables['PROJECT'][row['proj_id']].rels.push(row)}
        }
    }
    return tables
}