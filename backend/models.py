from sqlalchemy import Column, Integer, String, Date ,Boolean
from database import Base

class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=True)
    category = Column(String, nullable=False)
    is_fridge = Column(Boolean, default=False, nullable=False)
    min_quantity = Column(Integer, default=1, nullable=False)
class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ingredients = Column(String, nullable=False)  # stored as comma separated string e.g. "tomato, onion, rice"
    
        