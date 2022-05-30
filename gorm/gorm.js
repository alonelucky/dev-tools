;(function(){
    function covertType(type) {
        type = type.toLowerCase();
        switch (type) {
            case 'tinyint':
                return 'int8'
            case 'int':
                return 'int'
            case 'bigint':
                return 'int64'
            case 'boolean':
                return 'bool'
            case 'char': case 'varchar': case 'text': case 'longtext': case 'mediumtext': case 'tinytext':
                return 'string'
            case 'double': case 'decimal':
                return 'float64'
            case 'datetime': 
                return 'string'
            case 'timestamp':
                return 'uint64';
            default:
                return 'interface{}'
        }
    }

    this.gormGen = function(info) {
        var primaryKeyType = covertType(info.columns.filter(v => info.primaryKey.includes(v.name))[0].type || '');
        return `type ${formatKey(info.tableName)} struct {
    ${info.columns.map(v => `${formatKey(v.name)} ${covertType(v.type)} \`gorm:"colum:${v.name}" json:"${v.name}"\` // ${v.comment}`).join('\n')}
}

func (${formatKey(info.tableName)}) TableName() string {
    return "${info.tableName}"
}

type ${formatKey(info.tableName)}Dao struct{}

func New${formatKey(info.tableName)}Dao() ${formatKey(info.tableName)}Dao {
    return ${formatKey(info.tableName)}Dao{}
}

// New create new model
func (${formatKey(info.tableName)}Dao) New(tx *gorm.DB, item *${formatKey(info.tableName)}) (e error) {
    return tx.Create(item).Error
}

// FindByPK Find unique information by primary key
func (${formatKey(info.tableName)}Dao) FindByPK(tx *gorm.DB, ${info.columns.filter(v => info.primaryKey.includes(v.name)).map(v => `${formatKey(v.name)} ${covertType(v.type)}`).join(',')}) (item *${formatKey(info.tableName)}, e error) {
    item = &${formatKey(info.tableName)}{}
    e = tx.Model(item).Where(${info.primaryKey.length > 1 ? `map[string]interface{}{
        ${info.primaryKey.map(v => `"${v}": ${formatKey(v)},`).join('\n')}
    }` : `"${info.primaryKey[0]}", ${formatKey(info.primaryKey[0])}`}).Limit(1).Find(item).Error
    return
}

// FindOne Find one information by any
func (${formatKey(info.tableName)}Dao) FindOne(tx *gorm.DB, column string, value interface{}) (item *${formatKey(info.tableName)}, e error) {
    item = &${formatKey(info.tableName)}{}
    e = tx.Model(item).Where(column, value).Limit(1).Order("${info.primaryKey} desc").Find(item).Error
    return
}

// Update Update fields according to map
func (${formatKey(info.tableName)}Dao) Update(tx *gorm.DB, ${info.columns.filter(v => info.primaryKey.includes(v.name)).map(v => `${formatKey(v.name)} ${covertType(v.type)}`).join(',')}, data map[string]interface{}) (e error) {
    e = tx.Model(&${formatKey(info.tableName)}{}).Where(${info.primaryKey.length > 1 ? `map[string]interface{}{
        ${info.primaryKey.map(v => `"${v}": ${formatKey(v)},`).join('\n')}
    }` : `"${info.primaryKey[0]}", ${formatKey(info.primaryKey[0])}`}).Updates(data).Error
    return
}

// UpdateTableName Update the model and save the empty fields
func (${formatKey(info.tableName)}Dao) UpdateTableName(tx *gorm.DB, item *${formatKey(info.tableName)}) (e error) {
    e = tx.Save(item).Error
    return
}

// Delete delete data from table.
func (${formatKey(info.tableName)}Dao) Delete(tx *gorm.DB, ${info.columns.filter(v => info.primaryKey.includes(v.name)).map(v => `${formatKey(v.name)} ${covertType(v.type)}`).join(',')}) (e error) {
    e = tx.Where(${info.primaryKey.length > 1 ? `map[string]interface{}{
        ${info.primaryKey.map(v => `"${v}": ${formatKey(v)},`).join('\n')}
    }` : `"${info.primaryKey[0]}", ${formatKey(info.primaryKey[0])}`}).Delete(&${formatKey(info.tableName)}{}).Error
    return
}

// FindAll Query all according to where criteria. sizes: [0: size 1: page]
func (${formatKey(info.tableName)}Dao) FindAll(tx *gorm.DB, where map[string]interface{}, sizes ...int) (lst []*${formatKey(info.tableName)}, e error) {
    tx = tx.Model(&${formatKey(info.tableName)}{}).Where(where)
    if len(sizes) > 1 {
        tx = tx.Limit(sizes[0]).Offset((sizes[1] - 1) * sizes[0])
    }
    if len(sizes) == 1 {
        tx = tx.Limit(sizes[0])
    }
    e = tx.Find(lst).Error
    return
}`
    }
})();