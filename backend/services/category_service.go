package services

import (
	"budgetting-app/backend/models"

	"gorm.io/gorm"
)

type CategoryService struct {
	db *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{db: db}
}

func (s *CategoryService) List() ([]models.Category, error) {
	var categories []models.Category
	err := s.db.Order("name").Find(&categories).Error
	return categories, err
}

func (s *CategoryService) Create(category *models.Category) error {
	return s.db.Create(category).Error
}

func (s *CategoryService) Update(id uint, name string, colour string) (models.Category, error) {
	var category models.Category
	if err := s.db.First(&category, id).Error; err != nil {
		return category, err
	}
	if err := s.db.Model(&category).Updates(models.Category{Name: name, Colour: colour}).Error; err != nil {
		return category, err
	}
	return category, nil
}

func (s *CategoryService) Delete(id uint) error {
	var category models.Category
	if err := s.db.First(&category, id).Error; err != nil {
		return err
	}
	return s.db.Delete(&category).Error
}
