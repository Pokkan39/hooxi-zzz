import React from 'react';

export default function CategoryTabs({ categories, activeCategory, onCategoryChange }) {
  return (
    <nav className="hooxi-category-tabs" aria-label="分类筛选">
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`hooxi-category-tab ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onCategoryChange(cat.id)}
          type="button"
        >
          {cat.label}
        </button>
      ))}
    </nav>
  );
}
