
;(function(){
    function getTableName(line){
        var match = line.match(/create +.* +`?(?<name>[a-z_]+)`? *\(/i);
        if(!match || !match.groups) return "";
        return match.groups.name;
    }
    function getColumnInfo(line){
        var match = line.match(/ *`?(?<name>[a-z_]+)` +(?<type>[a-z]+)(( *\((?<desc>[\d\, ]+)\))?|(.*))((.*default +["`']?(?<value>[\S]+)["`']? +)?|(.*))((.*(comment) +["'`](?<comment>.*)["`'])?|.*)/i);
        if(!match) return null;
        return match.groups;
    }
    function getPrimaryKey(info, line){
        if(!/ *primary +key +/i.test(line)) return;
        if(info) return [info.name];
        var match = line.match(/ *primary +key *\((.*)\)/i);
        if(!match) return null;
        return match[1].match(/([a-z_]+)/ig);
    }

    this.parseSQL = function(sql) {
        let tableName = "";
        let columns = [];
        let primaryKey = [];

        let lines = sql.split('\n');
        for (const line of lines) {
            if(tableName == "") tableName = getTableName(line);
            var info = getColumnInfo(line);
            if(info) columns.push(info);
            if(!primaryKey || !primaryKey.length) primaryKey = getPrimaryKey(info, line);
        }
        return {
            tableName,
            primaryKey,
            columns
        };
    }
})();