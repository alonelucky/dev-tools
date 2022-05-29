package main

import "github.com/jinzhu/gorm"

type TableName struct {
	PK interface{}
}

func (TableName) TableName() string {
	return "table_name"
}

type TableNameDao struct{}

func NewTableNameDao() TableNameDao {
	return TableNameDao{}
}

// New create new model
func (TableNameDao) New(tx *gorm.DB, item *TableName) (e error) {
	return tx.Create(item).Error
}

// FindByPK Find unique information by primary key
func (TableNameDao) FindByPK(tx *gorm.DB, pk interface{}) (item *TableName, e error) {
	item = &TableName{}
	e = tx.Model(item).Where("", pk).Limit(1).Find(item).Error
	return
}

// FindOne Find one information by any
func (TableNameDao) FindOne(tx *gorm.DB, column string, value interface{}) (item *TableName, e error) {
	item = &TableName{}
	e = tx.Model(item).Where(column, value).Limit(1).Order("pk desc").Find(item).Error
	return
}

// Update Update fields according to map
func (TableNameDao) Update(tx *gorm.DB, pk interface{}, data map[string]interface{}) (e error) {
	e = tx.Model(&TableName{}).Where("", pk).Updates(data).Error
	return
}

// UpdateTableName Update the model and save the empty fields
func (TableNameDao) UpdateTableName(tx *gorm.DB, item *TableName) (e error) {
	e = tx.Save(item).Error
	return
}

// Delete delete data from table.
func (TableNameDao) Delete(tx *gorm.DB, pk interface{}) (e error) {
	e = tx.Delete(&TableName{PK: pk}).Error
	return
}

// FindAll Query all according to where criteria. sizes: [0: size 1: page]
func (TableNameDao) FindAll(tx *gorm.DB, where map[string]interface{}, sizes ...int) (lst []*TableName, e error) {
	tx = tx.Model(&TableName{}).Where(where)
	if len(sizes) > 1 {
		tx = tx.Limit(sizes[0]).Offset((sizes[1] - 1) * sizes[0])
	}
	if len(sizes) == 1 {
		tx = tx.Limit(sizes[0])
	}
	e = tx.Find(lst).Error
	return
}
