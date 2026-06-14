from dotenv import load_dotenv
import os
import httpx
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
import models
import json

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# in-memory cache for AI suggestions
# Why: avoid calling Groq every time, saves API quota
cache = {
    "last_pantry": None,
    "last_result": None
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["ngrok-skip-browser-warning"]  # allows ngrok to pass requests without warning page
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PantryItemCreate(BaseModel):
    name: str
    quantity: int
    unit: str
    expiry_date: Optional[date] = None
    category: str
    is_fridge: bool = False
    min_quantity: int = 1

class PantryItemUpdate(BaseModel):
    quantity: int
    expiry_date: Optional[date] = None

class RecipeCreate(BaseModel):
    name: str
    ingredients: str  # comma separated string

@app.get("/")
def read_root():
    return {"message": "Pantry Tracker API is running"}

@app.get("/items/shopping")
def get_shopping_list(db: Session = Depends(get_db)):
    today = date.today()
    soon = today + timedelta(days=5)
    items = db.query(models.PantryItem).all()
    shopping = []
    for item in items:
        if item.quantity < item.min_quantity:
            # current quantity dropped below item's own minimum threshold
            shopping.append({**item.__dict__, "reason": f"Low stock (min: {item.min_quantity})"})
        elif item.expiry_date and item.expiry_date < today:
            shopping.append({**item.__dict__, "reason": "Expired"})
        elif item.expiry_date and item.expiry_date <= soon:
            days_left = (item.expiry_date - today).days
            # calculate exact days remaining and put it in the message
            shopping.append({**item.__dict__, "reason": f"Expiring in {days_left} day(s)"})
    for item in shopping:
        item.pop("_sa_instance_state", None)
    return shopping

@app.get("/items")
def get_items(db: Session = Depends(get_db)):
    return db.query(models.PantryItem).all()

@app.post("/items")
def add_item(item: PantryItemCreate, db: Session = Depends(get_db)):
    db_item = models.PantryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/items/{item_id}")
def update_item(item_id: int, data: PantryItemUpdate, db: Session = Depends(get_db)):
    item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.quantity = data.quantity
    if data.expiry_date is not None:
        # update expiry date only if a new one was provided
        item.expiry_date = data.expiry_date
    db.commit()
    db.refresh(item)
    return item

@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}

@app.get("/recipes")
def get_recipes(db: Session = Depends(get_db)):
    # return all saved home recipes
    return db.query(models.Recipe).all()

@app.post("/recipes")
def add_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    # save new recipe to database
    db_recipe = models.Recipe(**recipe.dict())
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

class RecipeUpdate(BaseModel):
    name: str
    ingredients: str  # Why: allow updating both name and ingredients

@app.put("/recipes/{recipe_id}")
def update_recipe(recipe_id: int, data: RecipeUpdate, db: Session = Depends(get_db)):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    recipe.name = data.name  # update name
    recipe.ingredients = data.ingredients  # update ingredients
    db.commit()
    db.refresh(recipe)
    return recipe


@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    # delete a recipe by id
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return {"message": "Recipe deleted"}

class ShoppingNoteCreate(BaseModel):
    item_name: str
    note: Optional[str] = None

class ShoppingNoteUpdate(BaseModel):
    note: Optional[str] = None
    checked: Optional[bool] = None

@app.get("/shopping-notes")
def get_shopping_notes(db: Session = Depends(get_db)):
    # return all shopping notes
    return db.query(models.ShoppingNote).all()

@app.post("/shopping-notes")
def create_shopping_note(data: ShoppingNoteCreate, db: Session = Depends(get_db)):
    # create a note for a shopping item
    existing = db.query(models.ShoppingNote).filter(
        models.ShoppingNote.item_name == data.item_name
    ).first()
    if existing:
        # Why: if note already exists for this item, just return it
        return existing
    note = models.ShoppingNote(**data.dict())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@app.put("/shopping-notes/{note_id}")
def update_shopping_note(note_id: int, data: ShoppingNoteUpdate, db: Session = Depends(get_db)):
    note = db.query(models.ShoppingNote).filter(models.ShoppingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if data.note is not None:
        note.note = data.note  # update note text
    if data.checked is not None:
        note.checked = data.checked  # update checked status
    db.commit()
    db.refresh(note)
    return note

@app.delete("/shopping-notes/{note_id}")
def delete_shopping_note(note_id: int, db: Session = Depends(get_db)):
    # Why: when item is checked off and removed from shopping list, delete its note too
    note = db.query(models.ShoppingNote).filter(models.ShoppingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}

@app.get("/suggest")
async def suggest_recipes(db: Session = Depends(get_db)):
    items = db.query(models.PantryItem).all()

    # create a snapshot of current pantry to compare with cached state
    # Why: if pantry is same as last time, no need to call Groq again
    current_pantry = sorted([f"{item.name}-{item.quantity}" for item in items])

    # return cached result if pantry hasn't changed
    if cache["last_pantry"] == current_pantry and cache["last_result"] is not None:
        print("Returning cached suggestion")
        return cache["last_result"]

    pantry_summary = ", ".join([f"{item.quantity} {item.unit} of {item.name}" for item in items])
    api_key = os.getenv("GROQ_API_KEY")

    prompt = f"""I have these items in my pantry: {pantry_summary}.
Suggest 5 Indian dishes I can make. For each dish return a JSON array in this exact format:
[
  {{
    "dish": "dish name",
    "available": ["ingredient1", "ingredient2"],
    "missing": ["ingredient3"]
  }}
]
Return only the JSON array, no extra text."""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "llama-3.3-70b-versatile",  # current free Groq model
                "messages": [
                    {"role": "system", "content": "You are a helpful recipe assistant."},
                    {"role": "user", "content": prompt}
                ]
            }
        )

    result = response.json()

    if "error" in result:
        return {"error": result["error"]["message"]}

    if "choices" in result:
        text = result["choices"][0]["message"]["content"]
        text = text.strip().replace("```json", "").replace("```", "").strip()
        try:
            dishes = json.loads(text)
            # save to cache before returning
            # Why: next call with same pantry will skip Groq entirely
            cache["last_pantry"] = current_pantry
            cache["last_result"] = dishes
            return dishes
        except Exception:
            return {"suggestion": text}
    else:
        return {"error": "No choices returned"}

